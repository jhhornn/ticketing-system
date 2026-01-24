import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Trim } from 'class-sanitizer';
import { ApiProperty } from '@nestjs/swagger';
import { EventStatus } from '../../../common/enums/index.js';

export class CreateEventDto {
  @ApiProperty({ example: 'Summer Music Festival 2025' })
  @Trim()
  @IsString()
  @IsNotEmpty()
  eventName: string;

  @ApiProperty({ example: '2025-07-15T18:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  eventDate: string;

  @ApiProperty({ example: 1, required: false, description: 'Venue ID if using registered venue' })
  @IsNumber()
  @IsOptional()
  venueId?: number;

  @ApiProperty({ example: 'Central Park Amphitheater', required: false, description: 'Custom venue name if not using registered venue' })
  @Trim()
  @IsString()
  @IsOptional()
  customVenue?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @Min(1)
  totalSeats: number;

  @ApiProperty({ example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  saleStartTime?: string;

  @ApiProperty({ example: false, description: 'Whether the event is free (no payment required)' })
  @IsOptional()
  isFree?: boolean;
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

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  venueId?: number;

  @ApiProperty({ example: 'Central Park Amphitheater', required: false })
  @IsString()
  @IsOptional()
  customVenue?: string;

  @ApiProperty({ example: 1000, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  totalSeats?: number;

  @ApiProperty({ enum: EventStatus, example: EventStatus.ON_SALE, required: false })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiProperty({ example: '2025-01-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  saleStartTime?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  isFree?: boolean;
}

export class EventResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  eventName: string;

  @ApiProperty()
  eventDate: Date;

  @ApiProperty({ nullable: true })
  venueId: number | null;

  @ApiProperty({ nullable: true })
  venueName: string | null;

  @ApiProperty({ nullable: true })
  customVenue: string | null;

  @ApiProperty()
  totalSeats: number;

  @ApiProperty()
  availableSeats: number;

  @ApiProperty({ enum: EventStatus })
  status: EventStatus;

  @ApiProperty()
  saleStartTime: Date;

  @ApiProperty()
  isFree: boolean;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  hasActiveDiscounts?: boolean;
}

export class InventorySectionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: ['ASSIGNED', 'GENERAL'] })
  type: 'ASSIGNED' | 'GENERAL';

  @ApiProperty()
  price: number;

  @ApiProperty()
  capacity: {
    total: number;
    available: number;
  };

  @ApiProperty()
  mapCoordinates?: any;

  @ApiProperty({ required: false })
  seats?: {
    id: string;
    row: string;
    number: string;
    status: string;
  }[];
}

export class EventInventoryDto {
  @ApiProperty()
  eventId: string;

  @ApiProperty({ type: [InventorySectionDto] })
  sections: InventorySectionDto[];
}
