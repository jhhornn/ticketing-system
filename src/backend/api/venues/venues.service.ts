import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateVenueDto, VenueResponseDto } from './dto/venues.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class VenuesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateVenueDto): Promise<VenueResponseDto> {
    const venue = await this.prisma.venue.create({
      data: {
        name: dto.name,
        address: dto.address,
        capacity: dto.capacity,
        city: dto.city,
        state: dto.state,
        country: dto.country,
      },
    });

    // Create venue sections if provided
    if (dto.sections && dto.sections.length > 0) {
      await this.prisma.venueSection.createMany({
        data: dto.sections.map((section) => ({
          venueId: venue.id,
          name: section.name,
          type: section.type,
          totalCapacity: section.totalCapacity,
          rows: section.rows || 0,
          seatsPerRow: section.seatsPerRow || 0,
        })),
      });
    }

    // Fetch venue with sections
    const venueWithSections = await this.prisma.venue.findUnique({
      where: { id: venue.id },
      include: { venueSections: true },
    });

    if (!venueWithSections) {
      throw new NotFoundException(`Venue with ID ${venue.id} not found`);
    }

    return this.mapToDto(venueWithSections);
  }

  async findAll(): Promise<VenueResponseDto[]> {
    const venues = await this.prisma.venue.findMany({
      orderBy: { name: 'asc' },
      include: { venueSections: true },
    });
    return venues.map((v) => this.mapToDto(v));
  }

  async findOne(id: number): Promise<VenueResponseDto> {
    const venue = await this.prisma.venue.findUnique({
      where: { id: BigInt(id) },
      include: { venueSections: true },
    });

    if (!venue) {
      throw new NotFoundException(`Venue with ID ${id} not found`);
    }

    return this.mapToDto(venue);
  }

  private mapToDto(
    venue: Prisma.VenueGetPayload<{ include: { venueSections: true } }>,
  ): VenueResponseDto {
    return {
      id: Number(venue.id),
      name: venue.name,
      address: venue.address,
      capacity: venue.capacity,
      city: venue.city,
      state: venue.state,
      country: venue.country,
      sections:
        venue.venueSections?.map((section) => ({
          id: Number(section.id),
          name: section.name,
          type: section.type,
          totalCapacity: section.totalCapacity,
          rows: section.rows ?? undefined,
          seatsPerRow: section.seatsPerRow ?? undefined,
        })) || [],
    };
  }
}
