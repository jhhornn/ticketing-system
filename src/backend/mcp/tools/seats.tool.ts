import { Injectable } from '@nestjs/common';
import { SeatsService } from '../../api/seats/seats.service.js';
import { z } from 'zod';

@Injectable()
export class SeatsTool {
  constructor(private seatsService: SeatsService) {}

  public static readonly listAvailableSeatsSchema = z.object({
    eventId: z.number().min(1),
  });

  public static readonly getSeatSummarySchema = z.object({
    eventId: z.number().min(1),
  });

  async listAvailableSeats(args: z.infer<typeof SeatsTool.listAvailableSeatsSchema>) {
    return this.seatsService.getSeatMap(args.eventId);
  }

  async getSeatSummary(args: z.infer<typeof SeatsTool.getSeatSummarySchema>) {
    const seatMap = await this.seatsService.getSeatMap(args.eventId);
    return {
      eventId: seatMap.eventId,
      totalSeats: seatMap.totalSeats,
      availableSeats: seatMap.availableSeats,
      sections: seatMap.sections.length,
    };
  }
}
