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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { EventsService } from './events.service.js';
import { CreateEventDto, UpdateEventDto, EventResponseDto } from './dto/events.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ApiStandardResponse, ApiStandardArrayResponse, ApiErrorResponses } from '../../common/decorators/api-response.decorator.js';

@ApiTags('Events')
@Controller('events')
@ApiErrorResponses()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new event (Admin only)' })
  @ApiStandardResponse(HttpStatus.CREATED, 'Event created successfully', EventResponseDto)
  async create(@Body() dto: CreateEventDto): Promise<EventResponseDto> {
    return this.eventsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiStandardArrayResponse(HttpStatus.OK, 'Events retrieved successfully', EventResponseDto)
  async findAll(): Promise<EventResponseDto[]> {
    return this.eventsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiStandardResponse(HttpStatus.OK, 'Event retrieved successfully', EventResponseDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<EventResponseDto> {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event (Admin only)' })
  @ApiStandardResponse(HttpStatus.OK, 'Event updated successfully', EventResponseDto)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event (Admin only)' })
  @ApiStandardResponse(HttpStatus.OK, 'Event deleted successfully', Object) // Using Object as void return type wrapper
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.eventsService.remove(id);
    return { message: 'Event deleted successfully' };
  }
}
