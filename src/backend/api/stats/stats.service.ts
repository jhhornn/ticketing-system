import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { BookingStatus, EventStatus } from '../../common/enums/index.js';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(userId: string) {
    const [totalEvents, activeEvents, totalBookings, revenueData] = await Promise.all([
      // Total events count for this user
      this.prisma.event.count({
        where: { createdBy: userId },
      }),
      // Active events count for this user
      this.prisma.event.count({
        where: {
          createdBy: userId,
          status: { not: EventStatus.CANCELLED },
        },
      }),
      // Total confirmed bookings for user's events
      this.prisma.booking.count({
        where: {
          event: { createdBy: userId },
          status: BookingStatus.CONFIRMED,
        },
      }),
      // Total revenue from user's events
      this.prisma.booking.aggregate({
        where: {
          event: { createdBy: userId },
          status: BookingStatus.CONFIRMED,
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      totalEvents,
      activeEvents,
      totalBookings,
      totalRevenue: Number(revenueData._sum?.totalAmount || 0),
      userId,
    };
  }
}
