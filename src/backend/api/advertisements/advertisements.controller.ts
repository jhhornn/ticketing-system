// src/backend/api/advertisements/advertisements.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdvertisementsService } from './advertisements.service.js';
import {
  CreateAdvertisementDto,
  UpdateAdvertisementDto,
  AdvertisementResponseDto,
  IncrementAdStatsDto,
} from './dto/advertisement.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  ApiStandardResponse,
  ApiStandardArrayResponse,
  ApiErrorResponses,
} from '../../common/decorators/api-response.decorator.js';
import { AdPlacement } from '../../common/enums/index.js';

@ApiTags('Advertisements')
@Controller('advertisements')
@ApiErrorResponses()
export class AdvertisementsController {
  constructor(private readonly advertisementsService: AdvertisementsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new advertisement (Super Admin only)' })
  @ApiStandardResponse(
    HttpStatus.CREATED,
    'Advertisement created successfully',
    AdvertisementResponseDto,
  )
  async create(
    @Body() createDto: CreateAdvertisementDto,
    @CurrentUser() user: { id: string },
  ): Promise<AdvertisementResponseDto> {
    return this.advertisementsService.create(createDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all advertisements' })
  @ApiStandardArrayResponse(
    HttpStatus.OK,
    'Advertisements retrieved successfully',
    AdvertisementResponseDto,
  )
  async findAll(
    @Query('placement') placement?: AdPlacement,
  ): Promise<AdvertisementResponseDto[]> {
    return this.advertisementsService.findAll(placement);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active advertisements for display' })
  @ApiStandardArrayResponse(
    HttpStatus.OK,
    'Active advertisements retrieved successfully',
    AdvertisementResponseDto,
  )
  async findActive(
    @Query('placement') placement?: AdPlacement,
  ): Promise<AdvertisementResponseDto[]> {
    return this.advertisementsService.findActive(placement);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get advertisement by ID' })
  @ApiStandardResponse(
    HttpStatus.OK,
    'Advertisement retrieved successfully',
    AdvertisementResponseDto,
  )
  async findOne(@Param('id') id: string): Promise<AdvertisementResponseDto> {
    return this.advertisementsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update advertisement (Super Admin only)' })
  @ApiStandardResponse(
    HttpStatus.OK,
    'Advertisement updated successfully',
    AdvertisementResponseDto,
  )
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAdvertisementDto,
    @CurrentUser() user: { id: string },
  ): Promise<AdvertisementResponseDto> {
    return this.advertisementsService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete advertisement (Super Admin only)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<{ message: string }> {
    await this.advertisementsService.remove(id, user.id);
    return { message: 'Advertisement deleted successfully' };
  }

  @Post(':id/stats')
  @ApiOperation({ summary: 'Increment ad impression or click' })
  async incrementStats(
    @Param('id') id: string,
    @Body() dto: IncrementAdStatsDto,
  ): Promise<{ message: string }> {
    if (dto.type === 'impression') {
      await this.advertisementsService.incrementImpression(id);
    } else {
      await this.advertisementsService.incrementClick(id);
    }
    return { message: `${dto.type} incremented successfully` };
  }
}
