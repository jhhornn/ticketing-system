import { ApiProperty } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class DiscountResponseDto {
  @ApiProperty({ example: '12345678' })
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: DiscountType })
  type: DiscountType;

  @ApiProperty()
  validFrom: Date;

  @ApiProperty({ required: false })
  validUntil?: Date;

  @ApiProperty({ required: false })
  usageLimit?: number;

  @ApiProperty()
  usageCount: number;

  @ApiProperty({ required: false })
  minOrderAmount?: number;

  @ApiProperty({ required: false })
  eventId?: string;

  @ApiProperty()
  createdAt: Date;
}
