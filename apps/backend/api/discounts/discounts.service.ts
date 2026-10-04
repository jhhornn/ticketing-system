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
import { Discount, Prisma } from '@prisma/client';
import {
  type AuthRequestUser,
  isAdminUser,
} from '../auth/guards/auth-request.types.js';

type DiscountActor = Pick<AuthRequestUser, 'id' | 'role'>;

@Injectable()
export class DiscountsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyEventOwnership(
    eventId: number,
    user: DiscountActor,
  ): Promise<void> {
    if (isAdminUser(user)) {
      return;
    }

    const event = await this.prisma.event.findUnique({
      where: { id: BigInt(eventId) },
      select: { createdBy: true },
    });

    // SECURITY: Compare explicitly — a Prisma filter with an undefined value
    // silently matches every row.
    if (!event || !user.id || event.createdBy !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to manage discounts for this event',
      );
    }
  }

  /**
   * Event-scoped discounts require event ownership; global discounts (no
   * eventId) apply to every event and are restricted to admins.
   */
  private async verifyDiscountAccess(
    eventId: bigint | number | null | undefined,
    user: DiscountActor,
  ): Promise<void> {
    if (eventId) {
      await this.verifyEventOwnership(Number(eventId), user);
      return;
    }

    if (!isAdminUser(user)) {
      throw new ForbiddenException(
        'Only administrators can manage global discounts',
      );
    }
  }

  private async findExistingOrThrow(id: number): Promise<Discount> {
    const discount = await this.prisma.discount.findFirst({
      where: { id: BigInt(id) },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    return discount;
  }

  async create(
    createDiscountDto: CreateDiscountDto,
    user: DiscountActor,
  ): Promise<DiscountResponseDto> {
    await this.verifyDiscountAccess(createDiscountDto.eventId, user);

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

  async findOne(id: number, user: DiscountActor): Promise<DiscountResponseDto> {
    const discount = await this.findExistingOrThrow(id);
    await this.verifyDiscountAccess(discount.eventId, user);

    return this.mapToDto(discount);
  }

  async update(
    id: number,
    updateDiscountDto: UpdateDiscountDto,
    user: DiscountActor,
  ): Promise<DiscountResponseDto> {
    const existing = await this.findExistingOrThrow(id);
    await this.verifyDiscountAccess(existing.eventId, user);

    // Moving a discount to another event requires owning that event too
    if (updateDiscountDto.eventId) {
      await this.verifyEventOwnership(updateDiscountDto.eventId, user);
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

  async remove(id: number, user: DiscountActor): Promise<void> {
    const discount = await this.findExistingOrThrow(id);
    await this.verifyDiscountAccess(discount.eventId, user);

    await this.prisma.discount.delete({
      where: { id: BigInt(id) },
    });
  }

  async activate(
    id: number,
    user: DiscountActor,
  ): Promise<DiscountResponseDto> {
    const discount = await this.findExistingOrThrow(id);
    await this.verifyDiscountAccess(discount.eventId, user);

    const updated = await this.prisma.discount.update({
      where: { id: BigInt(id) },
      data: { isActive: true },
    });

    return this.mapToDto(updated);
  }

  async deactivate(
    id: number,
    user: DiscountActor,
  ): Promise<DiscountResponseDto> {
    const discount = await this.findExistingOrThrow(id);
    await this.verifyDiscountAccess(discount.eventId, user);

    const updated = await this.prisma.discount.update({
      where: { id: BigInt(id) },
      data: { isActive: false },
    });

    return this.mapToDto(updated);
  }

  async findByEventId(
    eventId: number,
    user: DiscountActor,
  ): Promise<DiscountResponseDto[]> {
    await this.verifyEventOwnership(eventId, user);

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
   * Atomically claim one use of a discount code.
   *
   * The limit check and the increment happen in a single conditional UPDATE,
   * so concurrent checkouts can never push usageCount past usageLimit.
   * Returns false if the code is inactive or already at its limit.
   */
  async reserveUsage(code: string): Promise<boolean> {
    const { count } = await this.prisma.discount.updateMany({
      where: {
        code,
        isActive: true,
        OR: [
          { usageLimit: null },
          { usageCount: { lt: this.prisma.discount.fields.usageLimit } },
        ],
      },
      data: { usageCount: { increment: 1 } },
    });

    return count === 1;
  }

  /**
   * Return a previously reserved use (failed or abandoned booking).
   * Never decrements below zero.
   */
  async releaseUsage(
    code: string,
    client: Pick<Prisma.TransactionClient, 'discount'> = this.prisma,
  ): Promise<void> {
    await client.discount.updateMany({
      where: { code, usageCount: { gt: 0 } },
      data: { usageCount: { decrement: 1 } },
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
