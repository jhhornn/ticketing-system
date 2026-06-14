import { IsNotEmpty, IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReservationStatus } from '../../../common/enums/index.js';

export class CreateReservationDto {
  @ApiProperty({
    description: 'Event ID',
    example: 1,
  })
  @IsNotEmpty()
  eventId: number;

  @ApiProperty({
    description: 'Array of seat numbers to reserve',
    example: ['A1', 'A2', 'A3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  seatNumbers: string[];

  @ApiProperty({
    description: 'User ID making the reservation',
    example: 'user123',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}

export class ReservationResponseDto {
  @ApiProperty({
    description: 'Unique reservation identifier',
    example: '1',
  })
  reservationId: string;

  @ApiProperty({
    description: 'Event ID',
    example: 1,
  })
  eventId: number;

  @ApiProperty({
    description: 'List of reserved seat numbers',
    type: [String],
    example: ['A1', 'A2', 'A3'],
  })
  seatNumbers: string[];

  @ApiProperty({
    description: 'User ID who made the reservation',
    example: 'user123',
  })
  userId: string;

  @ApiProperty({
    description: 'Reservation expiry timestamp',
    example: '2025-12-12T19:15:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Current reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.ACTIVE,
  })
  status: ReservationStatus;

  @ApiProperty({
    description: 'Reservation creation timestamp',
    example: '2025-12-12T19:00:00.000Z',
  })
  createdAt: Date;
}

export class CancelReservationDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  reservationId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId: string;
}
