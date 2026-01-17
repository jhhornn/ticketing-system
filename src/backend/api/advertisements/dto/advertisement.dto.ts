// src/backend/api/advertisements/dto/advertisement.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUrl,
  IsEnum,
  IsInt,
  IsOptional,
  IsArray,
  Min,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { AdStatus, AdPlacement } from '../../../common/enums/index.js';

export class CreateAdvertisementDto {
  @ApiProperty({ example: 'Summer Festival 2026' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Join us for the biggest music festival' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/images/ad.jpg' })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({ example: 'https://example.com/summer-festival' })
  @IsUrl()
  targetUrl: string;

  @ApiProperty({ enum: AdStatus, default: AdStatus.ACTIVE })
  @IsEnum(AdStatus)
  status: AdStatus;

  @ApiProperty({ enum: AdPlacement, isArray: true })
  @IsArray()
  @IsEnum(AdPlacement, { each: true })
  placement: AdPlacement[];

  @ApiProperty({ example: 10, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class UpdateAdvertisementDto {
  @ApiPropertyOptional({ example: 'Summer Festival 2026' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Join us for the biggest music festival' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/images/ad.jpg' })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/summer-festival' })
  @IsOptional()
  @IsUrl()
  targetUrl?: string;

  @ApiPropertyOptional({ enum: AdStatus })
  @IsOptional()
  @IsEnum(AdStatus)
  status?: AdStatus;

  @ApiPropertyOptional({ enum: AdPlacement, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(AdPlacement, { each: true })
  placement?: AdPlacement[];

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ example: '2026-06-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AdvertisementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  targetUrl: string;

  @ApiProperty({ enum: AdStatus })
  status: AdStatus;

  @ApiProperty({ enum: AdPlacement, isArray: true })
  placement: AdPlacement[];

  @ApiProperty()
  priority: number;

  @ApiProperty()
  impressions: number;

  @ApiProperty()
  clicks: number;

  @ApiProperty()
  startDate: Date;

  @ApiPropertyOptional()
  endDate?: Date;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class IncrementAdStatsDto {
  @ApiProperty({ enum: ['impression', 'click'] })
  @IsEnum(['impression', 'click'])
  type: 'impression' | 'click';
}
