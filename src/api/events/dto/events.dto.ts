import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../../common/enums/index.js';

export class CreateEventDto {
  @ApiProperty({ example: 'Summer Music Festival 2025' })
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @ApiProperty({ example: '2025-07-15T18:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @ApiProperty({ example: 'Central Park Amphitheater' })
  @IsString()
  @IsOptional()
  venueName?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(1)
  totalSeats: number;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  saleStartTime?: string;
}

export class UpdateEventDto {
  @ApiProperty({ example: 'Summer Music Festival 2025', required: false })
  @IsString()
  @IsOptional()
  eventName?: string;

  @ApiProperty({ example: '2025-07-15T18:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @ApiProperty({ example: 'Central Park Amphitheater', required: false })
  @IsString()
  @IsOptional()
  venueName?: string;

  @ApiProperty({ example: 1000, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  totalSeats?: number;

  @ApiProperty({ enum: EventStatus, example: EventStatus.ON_SALE, required: false })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;
}

export class EventResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  eventName: string;

  @ApiProperty()
  eventDate: Date;

  @ApiProperty()
  venueName: string;

  @ApiProperty()
  totalSeats: number;

  @ApiProperty()
  availableSeats: number;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty()
  saleStartTime: Date;

  @ApiProperty()
  createdAt: Date;
}
