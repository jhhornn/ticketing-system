import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { TenantResponseDto } from './dto/tenant-response.dto.js';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    throw new NotFoundException('Tenant system has been removed');
  }

  async findAll(): Promise<TenantResponseDto[]> {
    throw new NotFoundException('Tenant system has been removed');
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    throw new NotFoundException('Tenant system has been removed');
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<TenantResponseDto> {
    throw new NotFoundException('Tenant system has been removed');
  }

  async remove(id: string): Promise<void> {
    throw new NotFoundException('Tenant system has been removed');
  }
}
