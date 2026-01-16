import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @ApiProperty({ example: 'SUMMER2025' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 10.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: '2025-06-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @ApiProperty({ example: '2025-08-31T23:59:59Z', required: false })
  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @ApiProperty({ example: 100, required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @ApiProperty({ example: 50.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @ApiProperty({ example: 1, required: false, description: 'ID of the event this discount applies to' })
  @IsNumber()
  @IsOptional()
  eventId?: number;
}
