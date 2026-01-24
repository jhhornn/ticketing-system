// src/backend/api/sections/sections.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { AuditLogService } from '../../common/audit/audit-log.service.js';
import { SectionType } from '@prisma/client';
import {
  CreateSectionDto,
  UpdateSectionDto,
  SectionResponseDto,
} from './dto/sections.dto.js';

@Injectable()
export class SectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(
    createSectionDto: CreateSectionDto,
  ): Promise<SectionResponseDto> {
    const { eventId, generateSeats, rows, seatsPerRow, ...sectionData } =
      createSectionDto;

    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // SECURITY: Validate total capacity doesn't exceed event capacity
    await this.validateEventCapacity(eventId, sectionData.totalCapacity);

    // Validate seat generation parameters
    if (
      sectionData.type === (SectionType.ASSIGNED as string) &&
      generateSeats
    ) {
      if (!rows || !seatsPerRow) {
        throw new BadRequestException(
          'rows and seatsPerRow are required when generateSeats is true for ASSIGNED sections',
        );
      }

      if (rows * seatsPerRow !== sectionData.totalCapacity) {
        throw new BadRequestException(
          `totalCapacity (${sectionData.totalCapacity}) must equal rows × seatsPerRow (${rows * seatsPerRow})`,
        );
      }
    }

    // Create section
    const section = await this.prisma.eventSection.create({
      data: {
        eventId,
        name: sectionData.name,
        type: sectionData.type,
        price: sectionData.price,
        totalCapacity: sectionData.totalCapacity,
        allocated: 0,
      },
    });

    // Generate seats if requested
    if (
      sectionData.type === (SectionType.ASSIGNED as string) &&
      generateSeats &&
      rows &&
      seatsPerRow
    ) {
      await this.generateSeats(
        eventId,
        Number(section.id),
        rows,
        seatsPerRow,
        sectionData.price,
      );
    }

    // Audit log the creation
    await this.auditLog.log({
      entityType: 'EventSection',
      entityId: Number(section.id),
      action: 'CREATE',
      changes: { ...sectionData, eventId },
      performedBy: 'system', // TODO: Get from request context
    });

    return this.mapToResponse(section);
  }

  /**
   * Validate that adding a new section won't exceed event's total capacity
   */
  private async validateEventCapacity(
    eventId: number,
    newSectionCapacity: number,
    excludeSectionId?: number,
  ): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { eventSections: true },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Calculate total capacity including the new section
    let totalCapacity = newSectionCapacity;

    for (const section of event.eventSections) {
      // Skip the section being updated
      if (excludeSectionId && Number(section.id) === excludeSectionId) {
        continue;
      }
      totalCapacity += section.totalCapacity;
    }

    if (totalCapacity > event.totalSeats) {
      const available = event.totalSeats - (totalCapacity - newSectionCapacity);
      throw new BadRequestException(
        `Total section capacity (${totalCapacity}) would exceed event capacity (${event.totalSeats}). ` +
          `You can only add ${available} more seats.`,
      );
    }
  }

  async findByEvent(eventId: number): Promise<SectionResponseDto[]> {
    const sections = await this.prisma.eventSection.findMany({
      where: { eventId },
      orderBy: { id: 'asc' },
    });

    return sections.map((section) => this.mapToResponse(section));
  }

  async findOne(id: number): Promise<SectionResponseDto> {
    const section = await this.prisma.eventSection.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    return this.mapToResponse(section);
  }

  async update(
    id: number,
    updateSectionDto: UpdateSectionDto,
  ): Promise<SectionResponseDto> {
    const section = await this.prisma.eventSection.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    // Prevent reducing capacity below allocated
    if (
      updateSectionDto.totalCapacity &&
      updateSectionDto.totalCapacity < section.allocated
    ) {
      throw new BadRequestException(
        `Cannot reduce capacity to ${updateSectionDto.totalCapacity}. Already allocated: ${section.allocated}`,
      );
    }

    // If capacity is being changed, validate against event total
    if (
      updateSectionDto.totalCapacity &&
      updateSectionDto.totalCapacity !== section.totalCapacity
    ) {
      await this.validateEventCapacity(
        Number(section.eventId),
        updateSectionDto.totalCapacity,
        id, // Exclude this section from the calculation
      );
    }

    const updated = await this.prisma.eventSection.update({
      where: { id },
      data: updateSectionDto,
    });

    // Audit log the update
    await this.auditLog.log({
      entityType: 'EventSection',
      entityId: id,
      action: 'UPDATE',
      changes: updateSectionDto,
      performedBy: 'system', // TODO: Get from request context
      metadata: {
        oldValues: {
          name: section.name,
          price: section.price,
          totalCapacity: section.totalCapacity,
        },
      },
    });

    return this.mapToResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const section = await this.prisma.eventSection.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    // Check if any bookings exist for this event
    const bookingCount = await this.prisma.booking.count({
      where: {
        eventId: section.eventId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
    });

    if (bookingCount > 0) {
      throw new BadRequestException(
        'Cannot delete sections after bookings have been made for this event',
      );
    }

    // Prevent deletion if tickets allocated
    if (section.allocated > 0) {
      throw new BadRequestException(
        `Cannot delete section with allocated tickets (${section.allocated} allocated)`,
      );
    }

    // Only protect sections that were inherited from a registered venue
    // Manually created sections (venueId is null) can be deleted even if event uses a venue
    if (section.venueId) {
      throw new BadRequestException(
        'Cannot delete sections inherited from registered venues. Only manually created sections can be deleted.',
      );
    }

    // Delete associated seats first if ASSIGNED
    if (section.type === SectionType.ASSIGNED) {
      await this.prisma.seat.deleteMany({
        where: { sectionId: id },
      });
    }

    await this.prisma.eventSection.delete({
      where: { id },
    });

    // Audit log the deletion
    await this.auditLog.log({
      entityType: 'EventSection',
      entityId: id,
      action: 'DELETE',
      performedBy: 'system', // TODO: Get from request context
      metadata: {
        deletedSection: {
          name: section.name,
          type: section.type,
          totalCapacity: section.totalCapacity,
          eventId: Number(section.eventId),
        },
      },
    });
  }

  private async generateSeats(
    eventId: number,
    sectionId: number,
    rows: number,
    seatsPerRow: number,
    price: number,
  ): Promise<void> {
    const seatsData: {
      eventId: number;
      sectionId: number;
      seatNumber: string;
      rowNumber: string;
      seatType: 'REGULAR';
      price: number;
      status: 'AVAILABLE';
      version: number;
    }[] = [];
    const rowLetters = this.generateRowLetters(rows);

    for (const row of rowLetters) {
      for (let i = 1; i <= seatsPerRow; i++) {
        seatsData.push({
          eventId,
          sectionId,
          seatNumber: `${row}${i}`,
          rowNumber: row,
          seatType: 'REGULAR' as const,
          price,
          status: 'AVAILABLE' as const,
          version: 0,
        });
      }
    }

    await this.prisma.seat.createMany({
      data: seatsData,
    });
  }

  private generateRowLetters(count: number): string[] {
    const letters: string[] = [];
    for (let i = 0; i < count; i++) {
      if (i < 26) {
        letters.push(String.fromCharCode(65 + i)); // A-Z
      } else {
        const first = Math.floor(i / 26) - 1;
        const second = i % 26;
        letters.push(
          String.fromCharCode(65 + first) + String.fromCharCode(65 + second),
        ); // AA, AB, etc.
      }
    }
    return letters;
  }

  private mapToResponse(section: {
    id: bigint | number;
    eventId: bigint | number;
    name: string;
    type: string;
    price: number | { toNumber?: () => number; toString?: () => string };
    totalCapacity: number;
    allocated: number;
    createdAt: Date;
    updatedAt: Date;
  }): SectionResponseDto {
    return {
      id: Number(section.id),
      eventId: Number(section.eventId),
      name: section.name,
      type: section.type,
      price:
        typeof section.price === 'number'
          ? section.price
          : section.price.toNumber?.() || Number(section.price.toString?.()),
      totalCapacity: section.totalCapacity,
      allocated: section.allocated,
      available: section.totalCapacity - section.allocated,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }
}
