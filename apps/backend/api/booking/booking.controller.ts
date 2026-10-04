import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import type { IAuthenticatedRequest } from '../../common/interfaces/index.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import {
  type AuthRequestUser,
  isAdminUser,
} from '../auth/guards/auth-request.types.js';
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @CurrentUser() user: AuthRequestUser,
  ): Promise<BookingResponseDto> {
    // SECURITY: The booking owner is always the authenticated user, never the
    // client-supplied userId.
    return this.bookingService.confirmBooking(confirmBookingDto, user);
  }

  @Get('reference/:bookingReference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @CurrentUser() user: AuthRequestUser,
  ): Promise<BookingResponseDto> {
    return this.bookingService.getBookingByReference(bookingReference, user);
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
    @Req() req: IAuthenticatedRequest,
  ): Promise<BookingResponseDto[]> {
    const userId = req.user.id;
    return this.bookingService.getUserBookings(userId);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
    @CurrentUser() user: AuthRequestUser,
  ): Promise<BookingResponseDto[]> {
    if (userId !== user.id && !isAdminUser(user)) {
      throw new ForbiddenException(
        'You do not have permission to view these bookings',
      );
    }
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
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: IAuthenticatedRequest,
  ): Promise<BookingResponseDto[]> {
    return this.bookingService.getEventBookings(eventId, req.user.id);
  }
}
