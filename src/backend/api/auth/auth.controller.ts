import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto.js';
import {
  ApiStandardResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
} from '../../common/decorators/api-response.decorator.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiStandardResponse(
    HttpStatus.CREATED,
    'User registered successfully',
    AuthResponseDto,
  )
  @ApiConflictResponse('User with this email already exists')
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiStandardResponse(
    HttpStatus.OK,
    'User logged in successfully',
    AuthResponseDto,
  )
  @ApiUnauthorizedResponse('Invalid credentials')
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiStandardResponse(
    HttpStatus.OK,
    'Profile retrieved successfully',
    AuthResponseDto,
  )
  @ApiUnauthorizedResponse('Unauthorized')
  getProfile(
    @CurrentUser()
    user: {
      id: string;
      email: string;
      role: string;
      firstName: string;
      lastName: string;
    },
  ) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }
}
