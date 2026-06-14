import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatsService } from './stats.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { IAuthenticatedUser } from '../../common/interfaces/index.js';

@ApiTags('Stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({
    status: 200,
    description: 'User statistics retrieved successfully.',
  })
  async getUserStats(@CurrentUser() user: IAuthenticatedUser) {
    return this.statsService.getUserStats(user.id);
  }
}
