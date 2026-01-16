import { Injectable } from '@nestjs/common';
import { EventsService } from '../../api/events/events.service.js';
import { z } from 'zod';

@Injectable()
export class EventsTool {
  constructor(private eventsService: EventsService) {}

  public static readonly listEventsSchema = z.object({
    userId: z.string().optional(),
    onlyOwned: z.boolean().optional().default(false),
    limit: z.number().min(1).max(20).optional().default(10),
  });

  public static readonly getEventDetailsSchema = z.object({
    eventId: z.string().min(1),
  });

  async listEvents(args: z.infer<typeof EventsTool.listEventsSchema>) {
    const events = await this.eventsService.findAll(args.userId, args.onlyOwned);
    
    return events.slice(0, args.limit).map(e => ({
      id: e.id.toString(),
      name: e.eventName,
      date: e.eventDate,
      venue: e.venueName || e.customVenue,
      isFree: e.isFree,
      status: e.status,
    }));
  }

  async getEventDetails(args: z.infer<typeof EventsTool.getEventDetailsSchema>) {
    const event = await this.eventsService.findOne(Number(args.eventId));
    
    return {
      id: event.id.toString(),
      name: event.eventName,
      date: event.eventDate,
      venue: event.venueName || event.customVenue,
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
      isFree: event.isFree,
      createdBy: event.createdBy,
      status: event.status,
    };
  }
}
