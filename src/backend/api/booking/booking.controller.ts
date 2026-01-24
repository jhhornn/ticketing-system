import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { BookingService } from './booking.service.js';
import {
  ConfirmBookingDto,
  BookingResponseDto,
  // GetBookingDto,
} from './dto/booking.dto.js';
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
  @ApiStandardResponse(
    201,
    'Booking confirmed successfully',
    BookingResponseDto,
  )
  @ApiErrorResponses()
  @ApiConflictResponse('Duplicate idempotency key - booking already exists')
  async confirmBooking(
    @Body() confirmBookingDto: ConfirmBookingDto,
  ): Promise<BookingResponseDto> {
    return this.bookingService.confirmBooking(confirmBookingDto);
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
  ): Promise<BookingResponseDto> {
    return this.bookingService.getBookingByReference(bookingReference);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my bookings',
    description: 'Retrieves all bookings for the currently authenticated user.',
  })
  @ApiStandardArrayResponse(200, 'My bookings retrieved', BookingResponseDto)
  @ApiErrorResponses()
  async getMyBookings(
    @Req() req: { user: { id: string } },
  ): Promise<BookingResponseDto[]> {
    const userId = req.user.id;
    return this.bookingService.getUserBookings(userId);
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
  ): Promise<BookingResponseDto[]> {
    return this.bookingService.getUserBookings(userId);
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all bookings for an event (Event Organizer)',
    description: `
Retrieves all bookings for a specific event. Only accessible by the event owner.

**Perfect for:**
- Event organizer dashboard
- Sales analytics
- Attendee management
- Revenue tracking

**Returns:**
- Array of all event bookings with user details
- Includes payment status and seat information
- Sorted by booking date (newest first)
    `,
  })
  @ApiStandardArrayResponse(200, 'Event bookings retrieved', BookingResponseDto)
  @ApiErrorResponses()
  async getEventBookings(
    @Param('eventId') eventId: string,
    @Req() req: { user: { id: string } },
  ): Promise<BookingResponseDto[]> {
    return this.bookingService.getEventBookings(Number(eventId), req.user.id);
  }
}
