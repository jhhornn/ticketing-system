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
  Ip,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
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
import type { IAuthenticatedUser } from '../../common/interfaces/index.js';
import { AdPlacement } from '../../common/enums/index.js';
import {
  ApiStandardResponse,
  ApiStandardArrayResponse,
  ApiErrorResponses,
} from '../../common/decorators/api-response.decorator.js';

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
    @CurrentUser() user: IAuthenticatedUser,
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
  ): Promise<AdvertisementResponseDto> {
    return this.advertisementsService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete advertisement (Super Admin only)' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.advertisementsService.remove(id);
    return { message: 'Advertisement deleted successfully' };
  }

  @Post(':id/stats')
  // Tighter than the global limit: a real visitor only sees a few ads a minute
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @ApiOperation({
    summary: 'Record ad impression or click',
    description:
      'Public. Counted at most once per client, ad and type every 30 minutes.',
  })
  async incrementStats(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: IncrementAdStatsDto,
    @Ip() clientIp: string,
  ): Promise<{ message: string }> {
    await this.advertisementsService.recordInteraction(
      String(id),
      dto.type,
      clientIp || 'unknown',
    );
    // Same response whether or not it was counted, so the dedupe window
    // can't be probed
    return { message: `${dto.type} recorded` };
  }
}
