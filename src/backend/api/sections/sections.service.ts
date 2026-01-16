// src/backend/api/sections/sections.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateSectionDto, UpdateSectionDto, SectionResponseDto } from './dto/sections.dto.js';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSectionDto: CreateSectionDto): Promise<SectionResponseDto> {
    const { eventId, generateSeats, rows, seatsPerRow, ...sectionData } = createSectionDto;

    // Verify event exists
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Validate seat generation parameters
    if (sectionData.type === 'ASSIGNED' && generateSeats) {
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
    if (sectionData.type === 'ASSIGNED' && generateSeats && rows && seatsPerRow) {
      await this.generateSeats(eventId, Number(section.id), rows, seatsPerRow, sectionData.price);
    }

    return this.mapToResponse(section);
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

  async update(id: number, updateSectionDto: UpdateSectionDto): Promise<SectionResponseDto> {
    const section = await this.prisma.eventSection.findUnique({
      where: { id },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID ${id} not found`);
    }

    // Prevent reducing capacity below allocated
    if (updateSectionDto.totalCapacity && updateSectionDto.totalCapacity < section.allocated) {
      throw new BadRequestException(
        `Cannot reduce capacity to ${updateSectionDto.totalCapacity}. Already allocated: ${section.allocated}`,
      );
    }

    const updated = await this.prisma.eventSection.update({
      where: { id },
      data: updateSectionDto,
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
    if (section.type === 'ASSIGNED') {
      await this.prisma.seat.deleteMany({
        where: { sectionId: id },
      });
    }

    await this.prisma.eventSection.delete({
      where: { id },
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
        letters.push(String.fromCharCode(65 + first) + String.fromCharCode(65 + second)); // AA, AB, etc.
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
      price: typeof section.price === 'number' ? section.price : (section.price.toNumber?.() || Number(section.price.toString?.())),
      totalCapacity: section.totalCapacity,
      allocated: section.allocated,
      available: section.totalCapacity - section.allocated,
      createdAt: section.createdAt,
      updatedAt: section.updatedAt,
    };
  }
}
