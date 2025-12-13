import { ApiProperty } from '@nestjs/swagger';

/**
 * Standard API response wrapper for all successful responses
 */
export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Request processed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data payload',
  })
  data: T;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2025-12-12T19:00:00.000Z',
  })
  timestamp: string;

  constructor(data: T, message: string = 'Success', statusCode: number = 200) {
    this.statusCode = statusCode;
    this.success = true;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Paginated response wrapper for list endpoints
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Data retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Array of items',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2025-12-12T19:00:00.000Z',
  })
  timestamp: string;

  constructor(
    data: T[],
    total: number,
    page: number = 1,
    limit: number = 10,
    message: string = 'Data retrieved successfully',
  ) {
    this.statusCode = 200;
    this.success = true;
    this.message = message;
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Standard error response format
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Indicates if the request was successful (always false for errors)',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'Validation failed',
  })
  message: string;

  @ApiProperty({
    description: 'Detailed error information',
    required: false,
  })
  error?: string | object;

  @ApiProperty({
    description: 'Request path that caused the error',
    example: '/api/bookings/confirm',
    required: false,
  })
  path?: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2025-12-12T19:00:00.000Z',
  })
  timestamp: string;

  constructor(
    statusCode: number,
    message: string,
    error?: string | object,
    path?: string,
  ) {
    this.statusCode = statusCode;
    this.success = false;
    this.message = message;
    this.error = error;
    this.path = path;
    this.timestamp = new Date().toISOString();
  }
}
