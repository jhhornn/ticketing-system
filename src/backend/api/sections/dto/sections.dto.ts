// src/backend/api/sections/dto/sections.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export enum SectionType {
  GENERAL = 'GENERAL',
  ASSIGNED = 'ASSIGNED',
}

export class CreateSectionDto {
  @ApiProperty({
    description: 'Event ID this section belongs to',
    example: 1,
  })
  @IsInt()
  @Min(1)
  eventId: number;

  @ApiProperty({
    description: 'Section name',
    example: 'General Admission',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Section type',
    enum: SectionType,
    example: 'GENERAL',
  })
  @IsEnum(SectionType)
  type: SectionType;

  @ApiProperty({
    description: 'Price per ticket/seat',
    example: 50.0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Total capacity of this section',
    example: 500,
  })
  @IsInt()
  @Min(1)
  totalCapacity: number;

  @ApiProperty({
    description: 'Generate seats automatically for ASSIGNED sections',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  generateSeats?: boolean;

  @ApiProperty({
    description: 'Number of rows for seat generation (ASSIGNED only)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  rows?: number;

  @ApiProperty({
    description: 'Seats per row for seat generation (ASSIGNED only)',
    example: 20,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  seatsPerRow?: number;
}

export class UpdateSectionDto {
  @ApiProperty({
    description: 'Section name',
    example: 'VIP Section',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Price per ticket/seat',
    example: 150.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({
    description: 'Total capacity of this section',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  totalCapacity?: number;
}

export class SectionResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  eventId: number;

  @ApiProperty({ example: 'General Admission' })
  name: string;

  @ApiProperty({ enum: SectionType, example: 'GENERAL' })
  type: string;

  @ApiProperty({ example: 50.0 })
  price: number;

  @ApiProperty({ example: 500 })
  totalCapacity: number;

  @ApiProperty({ example: 0 })
  allocated: number;

  @ApiProperty({ example: 500 })
  available: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
