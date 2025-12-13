import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookingService } from './booking.service.js';
import {
  ConfirmBookingDto,
  BookingResponseDto,
  GetBookingDto,
} from './dto/booking.dto.js';
import { ApiResponseDto } from '../../common/dto/api-response.dto.js';
import {
  ApiStandardResponse,
  ApiStandardArrayResponse,
  ApiErrorResponses,
  ApiConflictResponse,
} from '../../common/decorators/api-response.decorator.js';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Confirm booking with payment',
    description: `
Confirms a reservation by processing payment and creating a booking.

**Features:**
- 🔒 Idempotency support - Safe to retry with the same key
- 🔄 Automatic rollback on payment failure (Saga pattern)
- 💳 Multiple payment methods supported
- ⚡ Distributed locking for data consistency

**Process Flow:**
1. Validates active reservation exists and hasn't expired
2. Processes payment via selected payment method
3. Creates booking record with reference code
4. Links seats to booking and updates statuses
5. Stores idempotency key for duplicate prevention

**Error Scenarios:**
- 400: Payment failed or reservation expired
- 404: Reservation not found
- 409: Duplicate idempotency key (booking already exists)
- 500: System error (payment refunded automatically)
    `,
  })
  @ApiStandardResponse(201, 'Booking confirmed successfully', BookingResponseDto)
  @ApiErrorResponses()
  @ApiConflictResponse('Duplicate idempotency key - booking already exists')
  async confirmBooking(
    @Body() confirmBookingDto: ConfirmBookingDto,
  ): Promise<ApiResponseDto<BookingResponseDto>> {
    const data = await this.bookingService.confirmBooking(confirmBookingDto);
    return new ApiResponseDto(
      data,
      'Booking confirmed successfully',
      HttpStatus.CREATED,
    );
  }

  @Get('reference/:bookingReference')
  @ApiOperation({
    summary: 'Get booking by reference',
    description: `
Retrieves booking details using the unique booking reference code.

**Use Cases:**
- Customer looking up their booking
- Support team retrieving booking information
- Email confirmation link lookup

**Response includes:**
- Complete booking details
- Payment status and transaction ID
- List of booked seat numbers
- Timestamps (created, confirmed)
    `,
  })
  @ApiStandardResponse(200, 'Booking found', BookingResponseDto)
  @ApiErrorResponses()
  async getBookingByReference(
    @Param('bookingReference') bookingReference: string,
  ): Promise<ApiResponseDto<BookingResponseDto>> {
    const data = await this.bookingService.getBookingByReference(bookingReference);
    return new ApiResponseDto(data, 'Booking retrieved successfully');
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get all bookings for a user',
    description: `
Retrieves all bookings for a specific user, ordered by creation date (newest first).

**Perfect for:**
- User booking history page
- Account management dashboard
- Email receipts and confirmations

**Returns:**
- Array of all user bookings regardless of status
- Each booking includes full details and seat information
- Sorted by most recent first
    `,
  })
  @ApiStandardArrayResponse(200, 'User bookings retrieved', BookingResponseDto)
  @ApiErrorResponses()
  async getUserBookings(
    @Param('userId') userId: string,
  ): Promise<ApiResponseDto<BookingResponseDto[]>> {
    const data = await this.bookingService.getUserBookings(userId);
    return new ApiResponseDto(data, 'User bookings retrieved successfully');
  }
}
