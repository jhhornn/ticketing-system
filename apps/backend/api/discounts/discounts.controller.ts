import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  // HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { DiscountsService } from './discounts.service.js';
import { CreateDiscountDto } from './dto/create-discount.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';
import { DiscountResponseDto } from './dto/discount-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthRequestUser } from '../auth/guards/auth-request.types.js';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new discount for your event' })
  @ApiResponse({
    status: 201,
    description: 'The discount has been successfully created.',
    type: DiscountResponseDto,
  })
  async create(
    @Body() createDiscountDto: CreateDiscountDto,
    @CurrentUser() user: AuthRequestUser,
  ): Promise<DiscountResponseDto> {
    return this.discountsService.create(createDiscountDto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all discounts (Super Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all discounts.',
    type: [DiscountResponseDto],
  })
  async findAll(): Promise<DiscountResponseDto[]> {
    return this.discountsService.findAll();
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all discounts for your event' })
  @ApiResponse({
    status: 200,
    description: 'List of discounts for the event.',
    type: [DiscountResponseDto],
  })
  async findByEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @CurrentUser() user: AuthRequestUser,
  ): Promise<DiscountResponseDto[]> {
    return this.discountsService.findByEventId(eventId, user);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a discount code' })
  @ApiResponse({ status: 200, description: 'Discount validation result.' })
  @ApiQuery({
    name: 'eventId',
    required: false,
    description: 'Optional event ID to validate discount for',
  })
  async validateDiscount(
    @Param('code') code: string,
    @Query('eventId') eventId?: string,
  ): Promise<{
    valid: boolean;
    discount?: DiscountResponseDto;
    reason?: string;
  }> {
    return this.discountsService.validateDiscount(
      code,
      eventId ? parseInt(eventId) : undefined,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a discount for your event by ID' })
  @ApiResponse({
    status: 200,
    description: 'The discount details.',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthRequestUser,
  ): Promise<DiscountResponseDto> {
    return this.discountsService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a discount for your event' })
  @ApiResponse({
    status: 200,
    description: 'The updated discount.',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDiscountDto: UpdateDiscountDto,
    @CurrentUser() user: AuthRequestUser,
  ): Promise<DiscountResponseDto> {
    return this.discountsService.update(id, updateDiscountDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a discount for your event' })
  @ApiResponse({
    status: 200,
    description: 'The discount has been successfully deleted.',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthRequestUser,
  ): Promise<void> {
    return this.discountsService.remove(id, user);
  }

  @Patch(':id/activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate a discount for your event' })
  @ApiResponse({
    status: 200,
    description: 'The discount has been activated.',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthRequestUser,
  ): Promise<DiscountResponseDto> {
    return this.discountsService.activate(id, user);
  }

  @Patch(':id/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a discount for your event' })
  @ApiResponse({
    status: 200,
    description: 'The discount has been deactivated.',
    type: DiscountResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Discount not found.' })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthRequestUser,
  ): Promise<DiscountResponseDto> {
    return this.discountsService.deactivate(id, user);
  }
}
