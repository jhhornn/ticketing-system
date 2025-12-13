import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateEventDto, UpdateEventDto, EventResponseDto } from './dto/events.dto.js';
import { EventStatus } from '../../common/enums/index.js';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEventDto): Promise<EventResponseDto> {
    const event = await this.prisma.event.create({
      data: {
        eventName: dto.eventName,
        eventDate: new Date(dto.eventDate),
        venueName: dto.venueName,
        totalSeats: dto.totalSeats,
        availableSeats: dto.totalSeats, // Initially all seats are available
        saleStartTime: dto.saleStartTime ? new Date(dto.saleStartTime) : null,
        status: EventStatus.UPCOMING,
      },
    });

    return this.mapToDto(event);
  }

  async findAll(): Promise<EventResponseDto[]> {
    const events = await this.prisma.event.findMany({
      orderBy: { eventDate: 'asc' },
    });
    return events.map(this.mapToDto);
  }

  async findOne(id: number): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(id) },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return this.mapToDto(event);
  }

  async update(id: number, dto: UpdateEventDto): Promise<EventResponseDto> {
    // Check if event exists
    await this.findOne(id);

    const event = await this.prisma.event.update({
      where: { id: BigInt(id) },
      data: {
        eventName: dto.eventName,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        venueName: dto.venueName,
        totalSeats: dto.totalSeats,
        status: dto.status,
      },
    });

    return this.mapToDto(event);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.event.delete({
      where: { id: BigInt(id) },
    });
  }

  private mapToDto(event: any): EventResponseDto {
    return {
      id: Number(event.id),
      eventName: event.eventName,
      eventDate: event.eventDate,
      venueName: event.venueName,
      totalSeats: event.totalSeats,
      availableSeats: event.availableSeats,
      status: event.status,
      saleStartTime: event.saleStartTime,
      createdAt: event.createdAt,
    };
  }
}
