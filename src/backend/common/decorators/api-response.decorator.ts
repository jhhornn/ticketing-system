import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto, ErrorResponseDto } from '../dto/api-response.dto.js';

/**
 * Decorator for standard successful API response
 * Wraps the response type in ApiResponseDto and documents it in Scalar
 */
export function ApiStandardResponse<T>(
  status: number,
  description: string,
  type?: Type<T>,
) {
  const decorators = [
    ApiExtraModels(ApiResponseDto),
  ];

  if (type) {
    decorators.push(ApiExtraModels(type));
    decorators.push(
      ApiResponse({
        status,
        description,
        schema: {
          allOf: [
            { $ref: getSchemaPath(ApiResponseDto) },
            {
              properties: {
                data: {
                  $ref: getSchemaPath(type),
                },
              },
            },
          ],
        },
      }),
    );
  } else {
    decorators.push(
      ApiResponse({
        status,
        description,
        type: ApiResponseDto,
      }),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * Decorator for array response wrapped in ApiResponseDto
 */
export function ApiStandardArrayResponse<T>(
  status: number,
  description: string,
  type: Type<T>,
) {
  return applyDecorators(
    ApiExtraModels(ApiResponseDto, type),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(type) },
              },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Decorator for common error responses (400, 404, 500)
 * Automatically adds standard error response documentation with correct status codes
 */
export function ApiErrorResponses() {
  const getErrorSchema = (status: number) => ({
    allOf: [
      { $ref: getSchemaPath(ErrorResponseDto) },
      {
        properties: {
          statusCode: { example: status },
          timestamp: { example: new Date().toISOString() },
        },
      },
    ],
  });

  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiResponse({
      status: 400,
      description: 'Bad Request - Validation failed or invalid input',
      schema: getErrorSchema(400),
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found - Resource does not exist',
      schema: getErrorSchema(404),
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error - System error occurred',
      schema: getErrorSchema(500),
    }),
  );
}

/**
 * Decorator for conflict response (409)
 */
export function ApiConflictResponse(description: string = 'Conflict - Resource already exists or operation conflicts with current state') {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiResponse({
      status: 409,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ErrorResponseDto) },
          {
            properties: {
              statusCode: { example: 409 },
              timestamp: { example: new Date().toISOString() },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Decorator for unauthorized response (401)
 */
export function ApiUnauthorizedResponse(description: string = 'Unauthorized - Authentication required') {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiResponse({
      status: 401,
      description,
      type: ErrorResponseDto,
    }),
  );
}

/**
 * Decorator for forbidden response (403)
 */
export function ApiForbiddenResponse(description: string = 'Forbidden - Insufficient permissions') {
  return applyDecorators(
    ApiExtraModels(ErrorResponseDto),
    ApiResponse({
      status: 403,
      description,
      type: ErrorResponseDto,
    }),
  );
}
