import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../../payment/strategies/payment-strategy.interface.js';
import { BookingStatus, PaymentStatus } from '../../../common/enums/index.js';

export class ConfirmBookingDto {
  @ApiProperty({
    description: 'Reservation ID to confirm',
    example: '123',
  })
  @IsNotEmpty()
  @IsString()
  reservationId: string;

  @ApiProperty({
    description: 'User ID making the booking',
    example: 'user123',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Payment method to use',
    enum: PaymentMethod,
    example: PaymentMethod.MOCK,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Idempotency key to prevent duplicate bookings',
    example: 'idem_abc123',
  })
  @IsNotEmpty()
  @IsString()
  idempotencyKey: string;

  @ApiProperty({
    description: 'Optional discount code',
    example: 'SUMMER2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  discountCode?: string;

  @ApiProperty({
    description: 'Payment metadata (optional)',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BookingResponseDto {
  @ApiProperty({
    description: 'Unique booking identifier',
    example: '1',
  })
  bookingId: string;

  @ApiProperty({
    description: 'Unique booking reference code',
    example: 'BK-ABC123XYZ',
  })
  bookingReference: string;

  @ApiProperty({
    description: 'Event ID',
    example: 1,
  })
  eventId: number;

  @ApiProperty({
    description: 'User ID who made the booking',
    example: 'user123',
  })
  userId: string;

  @ApiProperty({
    description: 'User email (only for event organizers)',
    example: 'user@example.com',
    required: false,
  })
  userEmail?: string;

  @ApiProperty({
    description: 'User full name (only for event organizers)',
    example: 'John Doe',
    required: false,
  })
  userName?: string;

  @ApiProperty({
    description: 'Total booking amount',
    example: 150.00,
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Current booking status',
    enum: BookingStatus,
    example: BookingStatus.CONFIRMED,
  })
  status: BookingStatus;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.SUCCESS,
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Payment transaction ID',
    example: 'pay_abc123',
    required: false,
  })
  paymentId?: string;

  @ApiProperty({
    description: 'List of booked seat numbers',
    type: [String],
    example: ['A1', 'A2'],
  })
  seatNumbers: string[];

  @ApiProperty({
    description: 'Booking creation timestamp',
    example: '2025-12-12T19:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Booking confirmation timestamp',
    example: '2025-12-12T19:05:00.000Z',
    required: false,
  })
  confirmedAt?: Date;
}

export class GetBookingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  bookingReference: string;
}
