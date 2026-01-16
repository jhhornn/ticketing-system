import { Body, Controller, Get, Param, ParseIntPipe, Post, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VenuesService } from './venues.service.js';
import { CreateVenueDto, VenueResponseDto } from './dto/venues.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../../common/enums/index.js';
import { ApiStandardResponse, ApiStandardArrayResponse, ApiErrorResponses } from '../../common/decorators/api-response.decorator.js';

@ApiTags('Venues')
@Controller('venues')
@ApiErrorResponses()
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @UseGuards(JwtAuthGuard) // Optionally restrict creation to admins or specific roles if needed, for now any auth user
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new venue' })
  @ApiStandardResponse(HttpStatus.CREATED, 'Venue created successfully', VenueResponseDto)
  async create(@Body() dto: CreateVenueDto): Promise<VenueResponseDto> {
    return this.venuesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all venues' })
  @ApiStandardArrayResponse(HttpStatus.OK, 'Venues retrieved successfully', VenueResponseDto)
  async findAll(): Promise<VenueResponseDto[]> {
    return this.venuesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue by ID' })
  @ApiStandardResponse(HttpStatus.OK, 'Venue retrieved successfully', VenueResponseDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<VenueResponseDto> {
    return this.venuesService.findOne(id);
  }
}
