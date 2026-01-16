import { ApiProperty } from '@nestjs/swagger';
import { SeatStatus, SeatType } from '@prisma/client';

export class SeatDto {
  @ApiProperty({ example: 1, description: 'Unique seat identifier' })
  id: number;

  @ApiProperty({ example: 'A1', description: 'Seat number display label' })
  seatNumber: string;

  @ApiProperty({ example: 'A', description: 'Row number', nullable: true })
  rowNumber: string | null;

  @ApiProperty({
    enum: SeatType,
    example: 'REGULAR',
    description: 'Seat category',
  })
  seatType: SeatType;

  @ApiProperty({ example: '50.00', description: 'Seat price' })
  price: string;

  @ApiProperty({
    enum: SeatStatus,
    example: 'AVAILABLE',
    description: 'Current seat status',
  })
  status: SeatStatus;

  @ApiProperty({
    example: 5,
    description: 'Version number for optimistic locking',
  })
  version: number;

  @ApiProperty({
    example: '2026-01-09T12:30:00Z',
    description: 'Reservation expiry time',
    nullable: true,
  })
  reservedUntil: Date | null;
}

export class SectionDto {
  @ApiProperty({ example: 'Orchestra', description: 'Section name' })
  name: string;

  @ApiProperty({ type: [SeatDto], description: 'Seats in this section' })
  seats: SeatDto[];

  @ApiProperty({ example: 100, description: 'Total seats in section' })
  totalSeats: number;

  @ApiProperty({ example: 45, description: 'Available seats in section' })
  availableSeats: number;

  @ApiProperty({ example: '35.00', description: 'Minimum price in section' })
  minPrice: string;

  @ApiProperty({ example: '75.00', description: 'Maximum price in section' })
  maxPrice: string;
}

export class SeatMapResponseDto {
  @ApiProperty({ example: 1, description: 'Event identifier' })
  eventId: number;

  @ApiProperty({ type: [SectionDto], description: 'Seat sections' })
  sections: SectionDto[];

  @ApiProperty({ example: 500, description: 'Total event capacity' })
  totalSeats: number;

  @ApiProperty({ example: 234, description: 'Currently available seats' })
  availableSeats: number;

  @ApiProperty({
    example: '2026-01-09T12:00:00Z',
    description: 'Data snapshot timestamp',
  })
  timestamp: Date;
}
