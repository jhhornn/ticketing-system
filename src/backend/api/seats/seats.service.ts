import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { SeatStatus } from '../../common/enums/index.js';
import {
  SeatMapResponseDto,
  SectionDto,
  SeatDto,
} from './dto/seat-map-response.dto.js';

@Injectable()
export class SeatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get optimized seat map grouped by sections
   * This reduces frontend rendering overhead and enables progressive loading
   */
  async getSeatMap(eventId: number): Promise<SeatMapResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(eventId) },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const seats = await this.prisma.seat.findMany({
      where: { eventId: BigInt(eventId) },
      orderBy: [
        { section: 'asc' },
        { rowNumber: 'asc' },
        { seatNumber: 'asc' },
      ],
    });

    // Group seats by section
    const sectionMap = new Map<string, SeatDto[]>();

    for (const seat of seats) {
      const sectionName = seat.section || 'General';
      if (!sectionMap.has(sectionName)) {
        sectionMap.set(sectionName, []);
      }

      sectionMap.get(sectionName)!.push({
        id: Number(seat.id),
        seatNumber: seat.seatNumber,
        rowNumber: seat.rowNumber,
        seatType: seat.seatType,
        price: seat.price?.toString() || '0',
        status: seat.status,
        version: Number(seat.version),
        reservedUntil: seat.reservedUntil,
      });
    }

    // Build section DTOs with aggregated stats
    const sections: SectionDto[] = Array.from(sectionMap.entries()).map(
      ([name, sectionSeats]) => {
        const prices = sectionSeats.map((s) => parseFloat(s.price));
        const availableCount = sectionSeats.filter(
          (s) => s.status === 'AVAILABLE',
        ).length;

        return {
          name,
          seats: sectionSeats,
          totalSeats: sectionSeats.length,
          availableSeats: availableCount,
          minPrice: Math.min(...prices).toFixed(2),
          maxPrice: Math.max(...prices).toFixed(2),
        };
      },
    );

    const totalAvailable = seats.filter((s) => s.status === 'AVAILABLE').length;

    return {
      eventId: Number(eventId),
      sections,
      totalSeats: Number(event.totalSeats),
      availableSeats: totalAvailable,
      timestamp: new Date(),
    };
  }

  async getAvailableSeats(eventId: string, tenantId: string) {
    // In a real multi-tenant system, we would filter by tenantId here
    // e.g., where: { event: { tenantId }, ... }
    return this.prisma.seat.findMany({
      where: {
        eventId: BigInt(eventId),
        status: SeatStatus.AVAILABLE,
      },
      select: {
        seatNumber: true,
        section: true,
        rowNumber: true,
        price: true,
        seatType: true,
      },
      take: 50, // Hard limit on result size
    });
  }

  async getSeatAvailabilitySummary(eventId: string, tenantId: string) {
    const stats = await this.prisma.seat.groupBy({
      by: ['status', 'seatType'],
      where: {
        eventId: BigInt(eventId),
      },
      _count: {
        _all: true,
      },
    });

    return stats.map((stat) => ({
      status: stat.status,
      type: stat.seatType,
      count: stat._count._all,
    }));
  }

  async getSeats(eventId: number) {
    return this.prisma.seat.findMany({
      where: {
        eventId: BigInt(eventId),
      },
      select: {
        id: true,
        seatNumber: true,
        section: true,
        rowNumber: true,
        price: true,
        seatType: true,
        status: true,
      },
      orderBy: [{ rowNumber: 'asc' }, { seatNumber: 'asc' }],
    });
  }
}
