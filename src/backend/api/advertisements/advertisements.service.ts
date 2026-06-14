// src/backend/api/advertisements/advertisements.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Advertisement, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/database/prisma.service.js';
import {
  CreateAdvertisementDto,
  UpdateAdvertisementDto,
  AdvertisementResponseDto,
} from './dto/advertisement.dto.js';
import { AdStatus, AdPlacement } from '../../common/enums/index.js';

@Injectable()
export class AdvertisementsService {
  constructor(private prisma: PrismaService) {}

  async create(
    dto: CreateAdvertisementDto,
    userId: string,
  ): Promise<AdvertisementResponseDto> {
    const advertisement = await this.prisma.advertisement.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        targetUrl: dto.targetUrl,
        status: dto.status,
        placement: dto.placement,
        priority: dto.priority || 0,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        createdBy: userId,
      },
    });

    return this.mapToResponse(advertisement);
  }

  async findAll(placement?: AdPlacement): Promise<AdvertisementResponseDto[]> {
    const where: Prisma.AdvertisementWhereInput = {};

    if (placement) {
      where.placement = {
        has: placement,
      };
    }

    const advertisements = await this.prisma.advertisement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return advertisements.map((advertisement) =>
      this.mapToResponse(advertisement),
    );
  }

  async findActive(
    placement?: AdPlacement,
  ): Promise<AdvertisementResponseDto[]> {
    const now = new Date();
    const where: Prisma.AdvertisementWhereInput = {
      status: AdStatus.ACTIVE,
      startDate: {
        lte: now,
      },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    };

    if (placement) {
      where.placement = {
        has: placement,
      };
    }

    const advertisements = await this.prisma.advertisement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 10, // Limit active ads
    });

    return advertisements.map((advertisement) =>
      this.mapToResponse(advertisement),
    );
  }

  async findOne(id: string): Promise<AdvertisementResponseDto> {
    const advertisement = await this.prisma.advertisement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!advertisement) {
      throw new NotFoundException(`Advertisement with ID ${id} not found`);
    }

    return this.mapToResponse(advertisement);
  }

  async update(
    id: string,
    dto: UpdateAdvertisementDto,
  ): Promise<AdvertisementResponseDto> {
    const existing = await this.prisma.advertisement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException(`Advertisement with ID ${id} not found`);
    }

    const updateData: Prisma.AdvertisementUpdateInput = {};

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.targetUrl !== undefined) updateData.targetUrl = dto.targetUrl;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.placement !== undefined) updateData.placement = dto.placement;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.startDate !== undefined)
      updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined)
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;

    const advertisement = await this.prisma.advertisement.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return this.mapToResponse(advertisement);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.advertisement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException(`Advertisement with ID ${id} not found`);
    }

    await this.prisma.advertisement.delete({
      where: { id: BigInt(id) },
    });
  }

  async incrementImpression(id: string): Promise<void> {
    await this.prisma.advertisement.update({
      where: { id: BigInt(id) },
      data: {
        impressions: {
          increment: 1,
        },
      },
    });
  }

  async incrementClick(id: string): Promise<void> {
    await this.prisma.advertisement.update({
      where: { id: BigInt(id) },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });
  }

  private mapToResponse(ad: Advertisement): AdvertisementResponseDto {
    return {
      id: ad.id.toString(),
      title: ad.title,
      description: ad.description ?? undefined,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      status: ad.status,
      placement: ad.placement,
      priority: ad.priority,
      impressions: ad.impressions,
      clicks: ad.clicks,
      startDate: ad.startDate,
      endDate: ad.endDate ?? undefined,
      createdBy: ad.createdBy,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
    };
  }
}
