import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateDiscountDto } from './dto/create-discount.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';
import { DiscountResponseDto } from './dto/discount-response.dto.js';
import { Discount } from '@prisma/client';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDiscountDto: CreateDiscountDto): Promise<DiscountResponseDto> {
    // Check if code already exists
    const existing = await this.prisma.discount.findFirst({
      where: {
        code: createDiscountDto.code,
      },
    });

    if (existing) {
       throw new BadRequestException('Discount code already exists');
    }

    const discount = await this.prisma.discount.create({
      data: {
        code: createDiscountDto.code,
        amount: createDiscountDto.amount,
        type: createDiscountDto.type,
        validFrom: createDiscountDto.validFrom ? new Date(createDiscountDto.validFrom) : new Date(),
        validUntil: createDiscountDto.validUntil ? new Date(createDiscountDto.validUntil) : null,
        usageLimit: createDiscountDto.usageLimit,
        minOrderAmount: createDiscountDto.minOrderAmount,
        eventId: createDiscountDto.eventId ? BigInt(createDiscountDto.eventId) : null,
      },
    });

    return this.mapToDto(discount);
  }

  async findAll(): Promise<DiscountResponseDto[]> {
    const discounts = await this.prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return discounts.map(this.mapToDto);
  }

  async findOne(id: number): Promise<DiscountResponseDto> {
    const discount = await this.prisma.discount.findFirst({
      where: {
        id: BigInt(id),
      },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    return this.mapToDto(discount);
  }

  async update(id: number, updateDiscountDto: UpdateDiscountDto): Promise<DiscountResponseDto> {
    await this.findOne(id); // ensure existence

    const discount = await this.prisma.discount.update({
      where: { id: BigInt(id) },
      data: {
        code: updateDiscountDto.code,
        amount: updateDiscountDto.amount,
        type: updateDiscountDto.type,
        validFrom: updateDiscountDto.validFrom ? new Date(updateDiscountDto.validFrom) : undefined,
        validUntil: updateDiscountDto.validUntil ? new Date(updateDiscountDto.validUntil) : undefined,
        usageLimit: updateDiscountDto.usageLimit,
        minOrderAmount: updateDiscountDto.minOrderAmount,
        eventId: updateDiscountDto.eventId ? BigInt(updateDiscountDto.eventId) : undefined,
      },
    });

    return this.mapToDto(discount);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.discount.delete({
      where: { id: BigInt(id) },
    });
  }

  private mapToDto(discount: Discount): DiscountResponseDto {
    return {
      id: discount.id.toString(),
      code: discount.code,
      amount: Number(discount.amount),
      type: discount.type,
      validFrom: discount.validFrom,
      validUntil: discount.validUntil ?? undefined,
      usageLimit: discount.usageLimit ?? undefined,
      usageCount: discount.usageCount,
      minOrderAmount: discount.minOrderAmount ? Number(discount.minOrderAmount) : undefined,
      eventId: discount.eventId ? discount.eventId.toString() : undefined,
      createdAt: discount.createdAt,
    };
  }
}
