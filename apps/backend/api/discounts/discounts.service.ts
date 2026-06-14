import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateDiscountDto } from './dto/create-discount.dto.js';
import { UpdateDiscountDto } from './dto/update-discount.dto.js';
import { DiscountResponseDto } from './dto/discount-response.dto.js';
import { Discount } from '@prisma/client';

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyEventOwnership(
    eventId: number,
    userId: string,
  ): Promise<void> {
    const event = await this.prisma.event.findFirst({
      where: {
        id: BigInt(eventId),
        createdBy: userId,
      },
    });

    if (!event) {
      throw new ForbiddenException(
        'You do not have permission to manage discounts for this event',
      );
    }
  }

  async create(
    createDiscountDto: CreateDiscountDto,
    userId: string,
  ): Promise<DiscountResponseDto> {
    // Verify event ownership if eventId is provided
    if (createDiscountDto.eventId) {
      await this.verifyEventOwnership(createDiscountDto.eventId, userId);
    }

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
        validFrom: createDiscountDto.validFrom
          ? new Date(createDiscountDto.validFrom)
          : new Date(),
        validUntil: createDiscountDto.validUntil
          ? new Date(createDiscountDto.validUntil)
          : null,
        usageLimit: createDiscountDto.usageLimit,
        minOrderAmount: createDiscountDto.minOrderAmount,
        eventId: createDiscountDto.eventId
          ? BigInt(createDiscountDto.eventId)
          : null,
      },
    });

    return this.mapToDto(discount);
  }

  async findAll(): Promise<DiscountResponseDto[]> {
    const discounts = await this.prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return discounts.map((d) => this.mapToDto(d));
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

  async update(
    id: number,
    updateDiscountDto: UpdateDiscountDto,
    userId: string,
  ): Promise<DiscountResponseDto> {
    const existing = await this.prisma.discount.findFirst({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Verify event ownership
    if (existing.eventId) {
      await this.verifyEventOwnership(Number(existing.eventId), userId);
    }

    const discount = await this.prisma.discount.update({
      where: { id: BigInt(id) },
      data: {
        code: updateDiscountDto.code,
        amount: updateDiscountDto.amount,
        type: updateDiscountDto.type,
        validFrom: updateDiscountDto.validFrom
          ? new Date(updateDiscountDto.validFrom)
          : undefined,
        validUntil: updateDiscountDto.validUntil
          ? new Date(updateDiscountDto.validUntil)
          : undefined,
        usageLimit: updateDiscountDto.usageLimit,
        minOrderAmount: updateDiscountDto.minOrderAmount,
        eventId: updateDiscountDto.eventId
          ? BigInt(updateDiscountDto.eventId)
          : undefined,
      },
    });

    return this.mapToDto(discount);
  }

  async remove(id: number, userId: string): Promise<void> {
    const discount = await this.prisma.discount.findFirst({
      where: { id: BigInt(id) },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Verify event ownership
    if (discount.eventId) {
      await this.verifyEventOwnership(Number(discount.eventId), userId);
    }

    await this.prisma.discount.delete({
      where: { id: BigInt(id) },
    });
  }

  async activate(id: number, userId: string): Promise<DiscountResponseDto> {
    const discount = await this.prisma.discount.findFirst({
      where: { id: BigInt(id) },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Verify event ownership
    if (discount.eventId) {
      await this.verifyEventOwnership(Number(discount.eventId), userId);
    }

    const updated = await this.prisma.discount.update({
      where: { id: BigInt(id) },
      data: { isActive: true },
    });

    return this.mapToDto(updated);
  }

  async deactivate(id: number, userId: string): Promise<DiscountResponseDto> {
    const discount = await this.prisma.discount.findFirst({
      where: { id: BigInt(id) },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    // Verify event ownership
    if (discount.eventId) {
      await this.verifyEventOwnership(Number(discount.eventId), userId);
    }

    const updated = await this.prisma.discount.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });

    return this.mapToDto(updated);
  }

  async findByEventId(eventId: number): Promise<DiscountResponseDto[]> {
    const discounts = await this.prisma.discount.findMany({
      where: {
        eventId: BigInt(eventId),
      },
      orderBy: { createdAt: 'desc' },
    });

    return discounts.map((d) => this.mapToDto(d));
  }

  /**
   * Validates if a discount can be applied
   * Checks: isActive, validFrom/validUntil dates, and usage limit
   */
  async validateDiscount(
    code: string,
    eventId?: number,
  ): Promise<{
    valid: boolean;
    discount?: DiscountResponseDto;
    reason?: string;
  }> {
    const discount = await this.prisma.discount.findFirst({
      where: { code },
    });

    if (!discount) {
      return { valid: false, reason: 'Discount code not found' };
    }

    // Check if discount is active
    if (!discount.isActive) {
      return { valid: false, reason: 'Discount is not active' };
    }

    // Check if discount is for a specific event
    if (discount.eventId && eventId && discount.eventId !== BigInt(eventId)) {
      return { valid: false, reason: 'Discount is not valid for this event' };
    }

    // Check date validity
    const now = new Date();
    if (discount.validFrom > now) {
      return { valid: false, reason: 'Discount is not yet valid' };
    }

    if (discount.validUntil && discount.validUntil < now) {
      return { valid: false, reason: 'Discount has expired' };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return { valid: false, reason: 'Discount usage limit reached' };
    }

    return {
      valid: true,
      discount: this.mapToDto(discount),
    };
  }

  /**
   * Increments the usage count when a discount is successfully applied
   */
  async incrementUsageCount(code: string): Promise<void> {
    await this.prisma.discount.updateMany({
      where: { code },
      data: {
        usageCount: {
          increment: 1,
        },
      },
    });
  }

  private mapToDto(discount: Discount): DiscountResponseDto {
    return {
      id: discount.id.toString(),
      code: discount.code,
      amount: Number(discount.amount),
      type: discount.type,
      isActive: discount.isActive,
      validFrom: discount.validFrom,
      validUntil: discount.validUntil ?? undefined,
      usageLimit: discount.usageLimit ?? undefined,
      usageCount: discount.usageCount,
      minOrderAmount: discount.minOrderAmount
        ? Number(discount.minOrderAmount)
        : undefined,
      eventId: discount.eventId ? discount.eventId.toString() : undefined,
      createdAt: discount.createdAt,
    };
  }
}
