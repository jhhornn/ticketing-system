import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class SeatReservationDto {
  @ApiProperty({ example: 1, description: 'Seat ID to reserve' })
  @IsInt()
  @Min(1)
  seatId: number;

  @ApiProperty({
    example: 5,
    description: 'Optimistic locking version from UI',
  })
  @IsInt()
  @Min(0)
  version: number;
}

export class CreateReservationDto {
  @ApiProperty({
    type: [SeatReservationDto],
    description: 'Array of seats to reserve with their versions',
    required: false,
    example: [
      { seatId: 1, version: 5 },
      { seatId: 2, version: 3 },
    ],
  })
  @IsArray()
  @IsOptional()
  seats?: SeatReservationDto[];

  @ApiProperty({
    description: 'Section ID for General Admission (GA)',
    required: false,
    example: 1,
  })
  @IsInt()
  @IsOptional()
  sectionId?: number;

  @ApiProperty({
    description: 'Quantity of tickets for GA',
    required: false,
    example: 2,
    default: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    example: 'session_abc123',
    description: 'Browser session ID for tracking (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ReservationResponseDto {
  @ApiProperty({ example: 1, description: 'Reservation ID' })
  id: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Successfully reserved seat IDs',
  })
  reservedSeatIds: number[];

  @ApiProperty({
    example: '2026-01-09T12:10:00Z',
    description: 'Expiration timestamp',
  })
  expiresAt: Date;

  @ApiProperty({ example: 600, description: 'Time remaining in seconds' })
  expiresInSeconds: number;

  @ApiProperty({
    example: [{ seatId: 4, reason: 'Already reserved by another user' }],
    description: 'Seats that failed to reserve',
    type: 'array',
    required: false,
  })
  failedSeats?: Array<{ seatId: number; reason: string }>;
}
