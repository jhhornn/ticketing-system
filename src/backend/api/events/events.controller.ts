// src/backend/api/events/events.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  HttpStatus,
  ParseIntPipe,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { EventsService } from './events.service.js';
import {
  CreateEventDto,
  UpdateEventDto,
  EventResponseDto,
  EventInventoryDto,
} from './dto/events.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { EventOwnerGuard } from '../auth/guards/event-owner.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  ApiStandardResponse,
  ApiStandardArrayResponse,
  ApiErrorResponses,
} from '../../common/decorators/api-response.decorator.js';

@ApiTags('Events')
@Controller('events')
@ApiErrorResponses()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new event',
    description:
      "Any authenticated user can create an event. A tenant will be automatically created if the user doesn't have one.",
  })
  @ApiStandardResponse(
    HttpStatus.CREATED,
    'Event created successfully',
    EventResponseDto,
  )
  async create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: { id: string },
  ): Promise<EventResponseDto> {
    return this.eventsService.create(dto, user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all events',
    description:
      'Returns all events. Use onlyOwned=true to get only events you own.',
  })
  @ApiQuery({ name: 'onlyOwned', required: false, type: Boolean })
  @ApiStandardArrayResponse(
    HttpStatus.OK,
    'Events retrieved successfully',
    EventResponseDto,
  )
  async findAll(
    @Query('onlyOwned', new ParseBoolPipe({ optional: true }))
    onlyOwned?: boolean,
    @CurrentUser() user?: { id: string },
  ): Promise<EventResponseDto[]> {
    return this.eventsService.findAll(user?.id, onlyOwned || false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiStandardResponse(
    HttpStatus.OK,
    'Event retrieved successfully',
    EventResponseDto,
  )
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventResponseDto> {
    return this.eventsService.findOne(id);
  }

  @Get(':id/can-purchase')
  @ApiOperation({
    summary: 'Check if tickets can be purchased for this event',
    description: 'Validates sale dates, event status, and availability',
  })
  @ApiStandardResponse(
    HttpStatus.OK,
    'Purchase eligibility checked',
    Object,
  )
  async canPurchaseTickets(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.canPurchaseTickets(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update event',
    description: 'Only the event owner can update their event',
  })
  @ApiStandardResponse(
    HttpStatus.OK,
    'Event updated successfully',
    EventResponseDto,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete event',
    description: 'Only the event owner can delete their event',
  })
  @ApiStandardResponse(HttpStatus.OK, 'Event deleted successfully', Object)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.eventsService.remove(id);
    return { message: 'Event deleted successfully' };
  }

  @Get(':id/inventory')
  @ApiOperation({ summary: 'Get event inventory (sections and seats)' })
  @ApiStandardResponse(
    HttpStatus.OK,
    'Event inventory retrieved successfully',
    EventInventoryDto,
  )
  async getInventory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventInventoryDto> {
    return this.eventsService.getEventInventory(id);
  }

  @Get(':id/discounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all discounts for an event' })
  async getEventDiscounts(@Param('id', ParseIntPipe) id: number) {
    // Import DiscountsService and inject it in constructor
    // For now, we'll add this endpoint in a separate discounts route
    return { message: 'Use /discounts/event/:eventId endpoint' };
  }
}
