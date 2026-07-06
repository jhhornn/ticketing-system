import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { SectionType } from '@prisma/client';

export class CreateVenueSectionDto {
  @ApiProperty({ example: 'VIP Section' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: ['ASSIGNED', 'GENERAL'], example: 'ASSIGNED' })
  @IsEnum(['ASSIGNED', 'GENERAL'])
  type: SectionType;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  totalCapacity: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  rows?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  seatsPerRow?: number;
}

export class CreateVenueDto {
  @ApiProperty({ example: 'Grand Hall' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '123 Main St, City, Country' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 1000 })
  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ type: [CreateVenueSectionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVenueSectionDto)
  sections?: CreateVenueSectionDto[];
}

export class VenueSectionResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  totalCapacity: number;

  @ApiProperty()
  rows?: number;

  @ApiProperty()
  seatsPerRow?: number;
}

export class VenueResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  address: string | null;

  @ApiProperty()
  capacity: number;

  @ApiProperty()
  city: string | null;

  @ApiProperty()
  state: string | null;

  @ApiProperty()
  country: string | null;

  @ApiProperty({ type: [VenueSectionResponseDto], required: false })
  sections?: VenueSectionResponseDto[];
}
