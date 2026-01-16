import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service.js';
import { CreateDiscountDto } from './dto/create-discount.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';
import { DiscountResponseDto } from './dto/discount-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '@prisma/client';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new discount (Admin only)' })
  @ApiResponse({ status: 201, description: 'The discount has been successfully created.', type: DiscountResponseDto })
  async create(@Body() createDiscountDto: CreateDiscountDto): Promise<DiscountResponseDto> {
    return this.discountsService.create(createDiscountDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all discounts' })
  @ApiResponse({ status: 200, description: 'List of all discounts.', type: [DiscountResponseDto] })
  async findAll(): Promise<DiscountResponseDto[]> {
    return this.discountsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a discount by ID' })
  @ApiResponse({ status: 200, description: 'The discount details.', type: DiscountResponseDto })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<DiscountResponseDto> {
    return this.discountsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a discount' })
  @ApiResponse({ status: 200, description: 'The updated discount.', type: DiscountResponseDto })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDiscountDto: UpdateDiscountDto): Promise<DiscountResponseDto> {
    return this.discountsService.update(id, updateDiscountDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a discount' })
  @ApiResponse({ status: 200, description: 'The discount has been successfully deleted.' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.discountsService.remove(id);
  }
}
