import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpStatus, ParseIntPipe, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service.js';
import { CreateDiscountDto } from './dto/create-discount.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';
import { DiscountResponseDto } from './dto/discount-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new discount for your event' })
  @ApiResponse({ status: 201, description: 'The discount has been successfully created.', type: DiscountResponseDto })
  async create(@Body() createDiscountDto: CreateDiscountDto, @Request() req): Promise<DiscountResponseDto> {
    return this.discountsService.create(createDiscountDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all discounts' })
  @ApiResponse({ status: 200, description: 'List of all discounts.', type: [DiscountResponseDto] })
  async findAll(): Promise<DiscountResponseDto[]> {
    return this.discountsService.findAll();
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Get all discounts for a specific event' })
  @ApiResponse({ status: 200, description: 'List of discounts for the event.', type: [DiscountResponseDto] })
  async findByEvent(@Param('eventId', ParseIntPipe) eventId: number): Promise<DiscountResponseDto[]> {
    return this.discountsService.findByEventId(eventId);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a discount code' })
  @ApiResponse({ status: 200, description: 'Discount validation result.' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Optional event ID to validate discount for' })
  async validateDiscount(
    @Param('code') code: string,
    @Query('eventId') eventId?: string,
  ): Promise<{ valid: boolean; discount?: DiscountResponseDto; reason?: string }> {
    return this.discountsService.validateDiscount(code, eventId ? parseInt(eventId) : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a discount by ID' })
  @ApiResponse({ status: 200, description: 'The discount details.', type: DiscountResponseDto })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DiscountResponseDto> {
    return this.discountsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a discount for your event' })
  @ApiResponse({ status: 200, description: 'The updated discount.', type: DiscountResponseDto })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDiscountDto: UpdateDiscountDto, @Request() req): Promise<DiscountResponseDto> {
    return this.discountsService.update(id, updateDiscountDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a discount for your event' })
  @ApiResponse({ status: 200, description: 'The discount has been successfully deleted.' })
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<void> {
    return this.discountsService.remove(id, req.user.userId);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a discount for your event' })
  @ApiResponse({ status: 200, description: 'The discount has been activated.', type: DiscountResponseDto })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async activate(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<DiscountResponseDto> {
    return this.discountsService.activate(id, req.user.userId);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a discount for your event' })
  @ApiResponse({ status: 200, description: 'The discount has been deactivated.', type: DiscountResponseDto })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async deactivate(@Param('id', ParseIntPipe) id: number, @Request() req): Promise<DiscountResponseDto> {
    return this.discountsService.deactivate(id, req.user.userId);
  }
}
