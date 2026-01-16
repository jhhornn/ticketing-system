// src/backend/api/sections/sections.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { SectionsService } from './sections.service.js';
import {
  CreateSectionDto,
  UpdateSectionDto,
  SectionResponseDto,
} from './dto/sections.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  ApiStandardResponse,
  ApiStandardArrayResponse,
  ApiErrorResponses,
} from '../../common/decorators/api-response.decorator.js';

@ApiTags('Event Sections')
@Controller('sections')
@ApiErrorResponses()
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new event section',
    description: 'Create a ticket section for an event. Can auto-generate seats for ASSIGNED sections.',
  })
  @ApiStandardResponse(HttpStatus.CREATED, 'Section created successfully', SectionResponseDto)
  async create(@Body() createSectionDto: CreateSectionDto) {
    const data = await this.sectionsService.create(createSectionDto);
    return { data };
  }

  @Get('event/:eventId')
  @ApiOperation({
    summary: 'Get all sections for an event',
    description: 'Retrieve all ticket sections for a specific event.',
  })
  @ApiParam({ name: 'eventId', type: Number })
  @ApiStandardArrayResponse(HttpStatus.OK, 'Event sections retrieved successfully', SectionResponseDto)
  async findByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    const data = await this.sectionsService.findByEvent(eventId);
    return { data };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a specific section',
    description: 'Retrieve details of a specific event section.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiStandardResponse(HttpStatus.OK, 'Section retrieved successfully', SectionResponseDto)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.sectionsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a section',
    description: 'Update section details like name, price, or capacity.',
  })
  @ApiParam({ name: 'id', type: Number })
  @ApiStandardResponse(HttpStatus.OK, 'Section updated successfully', SectionResponseDto)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    const data = await this.sectionsService.update(id, updateSectionDto);
    return { data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a section',
    description: 'Delete an event section. Only possible if no tickets are allocated.',
  })
  @ApiParam({ name: 'id', type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.sectionsService.remove(id);
  }
}
