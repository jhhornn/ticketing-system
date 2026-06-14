// src/backend/api/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/database/prisma.service.js';
import { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto.js';
import { RequestContextService } from '../../common/logger/request-context.service.js';
import { Role } from '@prisma/client';
import {
  AUTH_ACTIONS,
  AUTH_ERROR_MESSAGES,
  AUTH_FAILURE_REASONS,
} from './auth.constants.js';

/**
 * AuthService with observability
 *
 * OBSERVABILITY PATTERN:
 * - Add business context via RequestContextService
 * - Context is automatically included in wide events
 * - No need to manually pass context around
 * - Errors include full context automatically
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private requestContext: RequestContextService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    this.addAuthActionContext(AUTH_ACTIONS.register, dto.email);

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      // Add context about the conflict
      this.requestContext.addBusinessContext({
        auth_conflict: AUTH_FAILURE_REASONS.emailAlreadyExists,
      });
      throw new ConflictException(AUTH_ERROR_MESSAGES.userAlreadyExists);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: Role.USER,
      },
    });

    // Add user context after successful registration
    // WHY: Track new user signups, analyze user growth
    this.requestContext.update({
      user_id: user.id.toString(),
      user_email: user.email,
      user_role: user.role,
    });

    this.requestContext.addBusinessContext({
      auth_registration_success: true,
      auth_user_role: user.role,
    });

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    return this.toAuthResponse(token, user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    this.addAuthActionContext(AUTH_ACTIONS.login, dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Add context for failed login attempt
      // WHY: Security monitoring - detect brute force attacks
      this.requestContext.addBusinessContext({
        auth_login_failure_reason: AUTH_FAILURE_REASONS.userNotFound,
      });
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.invalidCredentials);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      // Add context for invalid password
      // WHY: Security monitoring - track failed password attempts
      this.requestContext.update({
        user_id: user.id.toString(), // Include user ID for tracking
      });
      this.requestContext.addBusinessContext({
        auth_login_failure_reason: AUTH_FAILURE_REASONS.invalidPassword,
      });
      throw new UnauthorizedException(AUTH_ERROR_MESSAGES.invalidCredentials);
    }

    // Successful login - add full user context
    // WHY: Every subsequent log in this request will include user info
    this.requestContext.update({
      user_id: user.id.toString(),
      user_email: user.email,
      user_role: user.role,
    });

    this.requestContext.addBusinessContext({
      auth_login_success: true,
      auth_user_role: user.role,
    });

    const token = this.generateToken(user.id, user.email, user.role);

    return this.toAuthResponse(token, user);
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  private addAuthActionContext(
    action: (typeof AUTH_ACTIONS)[keyof typeof AUTH_ACTIONS],
    email: string,
  ): void {
    this.requestContext.addBusinessContext({
      auth_action: action,
      auth_email_domain: this.extractEmailDomain(email),
    });
  }

  private extractEmailDomain(email: string): string {
    return email.split('@')[1] || 'unknown';
  }

  private toAuthResponse(
    token: string,
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: Role;
    },
  ): AuthResponseDto {
    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        role: user.role,
      },
    };
  }
}
