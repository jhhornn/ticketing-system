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
import type { IAuthenticatedUser } from '../../common/interfaces/index.js';
import {
  ApiStandardResponse,
  ApiStandardArrayResponse,
  ApiErrorResponses,
} from '../../common/decorators/api-response.decorator.js';
import { EVENTS_RESPONSE_MESSAGES } from './events.constants.js';

type EventInventoryPayload = {
  eventId: number;
  sections: Array<{
    id: number;
    name: string;
    type: string;
    price: number;
    capacity: {
      total: number;
      available: number;
    };
    mapCoordinates: unknown;
    seats?: Array<{
      id: number;
      row: string;
      number: string;
      status: string;
      version: number;
    }>;
  }>;
};

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
    description: 'Any authenticated user can create an event.',
  })
  @ApiStandardResponse(
    HttpStatus.CREATED,
    EVENTS_RESPONSE_MESSAGES.created,
    EventResponseDto,
  )
  async create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: IAuthenticatedUser,
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
    EVENTS_RESPONSE_MESSAGES.retrievedList,
    EventResponseDto,
  )
  async findAll(
    @Query('onlyOwned', new ParseBoolPipe({ optional: true }))
    onlyOwned?: boolean,
    @CurrentUser() user?: IAuthenticatedUser,
  ): Promise<EventResponseDto[]> {
    return this.eventsService.findAll(user?.id, onlyOwned || false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiStandardResponse(
    HttpStatus.OK,
    EVENTS_RESPONSE_MESSAGES.retrievedOne,
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
    EVENTS_RESPONSE_MESSAGES.purchaseEligibilityChecked,
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
    EVENTS_RESPONSE_MESSAGES.updated,
    EventResponseDto,
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: IAuthenticatedUser,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, EventOwnerGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete event',
    description: 'Only the event owner can delete their event',
  })
  @ApiStandardResponse(HttpStatus.OK, EVENTS_RESPONSE_MESSAGES.deleted, Object)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.eventsService.remove(id);
    return { message: EVENTS_RESPONSE_MESSAGES.deleted };
  }

  @Get(':id/inventory')
  @ApiOperation({ summary: 'Get event inventory (sections and seats)' })
  @ApiStandardResponse(
    HttpStatus.OK,
    EVENTS_RESPONSE_MESSAGES.inventoryRetrieved,
    EventInventoryDto,
  )
  async getInventory(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventInventoryDto> {
    const inventory = await this.eventsService.getEventInventory(id);
    return this.toEventInventoryDto(inventory);
  }

  private toEventInventoryDto(
    inventory: EventInventoryPayload,
  ): EventInventoryDto {
    return {
      eventId: inventory.eventId.toString(),
      sections: inventory.sections.map((section) => ({
        ...section,
        id: section.id.toString(),
        type: section.type as 'ASSIGNED' | 'GENERAL',
        seats: section.seats?.map((seat) => ({
          ...seat,
          id: seat.id.toString(),
        })),
      })),
    };
  }

  @Get(':id/discounts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all discounts for an event' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getEventDiscounts(@Param('id', ParseIntPipe) id: number) {
    // Import DiscountsService and inject it in constructor
    // For now, we'll add this endpoint in a separate discounts route
    return { message: EVENTS_RESPONSE_MESSAGES.discountsHint };
  }
}
