// src/backend/api/advertisements/advertisements.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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
    const where: any = {};
    
    if (placement) {
      where.placement = {
        has: placement,
      };
    }

    const advertisements = await this.prisma.advertisement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return advertisements.map(this.mapToResponse);
  }

  async findActive(placement?: AdPlacement): Promise<AdvertisementResponseDto[]> {
    const now = new Date();
    const where: any = {
      status: AdStatus.ACTIVE,
      startDate: {
        lte: now,
      },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    };

    if (placement) {
      where.placement = {
        has: placement,
      };
    }

    const advertisements = await this.prisma.advertisement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 10, // Limit active ads
    });

    return advertisements.map(this.mapToResponse);
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
    userId: string,
  ): Promise<AdvertisementResponseDto> {
    const existing = await this.prisma.advertisement.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existing) {
      throw new NotFoundException(`Advertisement with ID ${id} not found`);
    }

    const updateData: any = {};
    
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.imageUrl !== undefined) updateData.imageUrl = dto.imageUrl;
    if (dto.targetUrl !== undefined) updateData.targetUrl = dto.targetUrl;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.placement !== undefined) updateData.placement = dto.placement;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;

    const advertisement = await this.prisma.advertisement.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return this.mapToResponse(advertisement);
  }

  async remove(id: string, userId: string): Promise<void> {
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

  private mapToResponse(ad: any): AdvertisementResponseDto {
    return {
      id: ad.id.toString(),
      title: ad.title,
      description: ad.description,
      imageUrl: ad.imageUrl,
      targetUrl: ad.targetUrl,
      status: ad.status,
      placement: ad.placement,
      priority: ad.priority,
      impressions: ad.impressions,
      clicks: ad.clicks,
      startDate: ad.startDate,
      endDate: ad.endDate,
      createdBy: ad.createdBy,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
    };
  }
}
