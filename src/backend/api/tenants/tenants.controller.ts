import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service.js';
import { CreateTenantDto } from './dto/create-tenant.dto.js';
import { UpdateTenantDto } from './dto/update-tenant.dto.js';
import { TenantResponseDto } from './dto/tenant-response.dto.js';
// import { RolesGuard } from '../auth/guards/roles.guard.js'; // Assuming you strictly control this via Roles
// import { Roles } from '../auth/decorators/roles.decorator.js';
// import { Role } from '../../common/enums/role.enum.js';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new tenant organization' })
  @ApiResponse({ status: 201, description: 'The tenant has been successfully created.', type: TenantResponseDto })
  async create(@Body() createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all tenants' })
  @ApiResponse({ status: 200, description: 'List of all tenants.', type: [TenantResponseDto] })
  async findAll(): Promise<TenantResponseDto[]> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by ID' })
  @ApiResponse({ status: 200, description: 'The tenant details.', type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  async findOne(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiResponse({ status: 200, description: 'The updated tenant.', type: TenantResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  async update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto): Promise<TenantResponseDto> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  // @Delete(':id')
  // @ApiOperation({ summary: 'Delete a tenant' })
  // @ApiResponse({ status: 200, description: 'The tenant has been successfully deleted.' })
  // async remove(@Param('id') id: string): Promise<void> {
  //   return this.tenantsService.remove(id);
  // }
}
