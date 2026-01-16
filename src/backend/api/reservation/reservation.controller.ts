import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationService } from './reservation.service.js';
import {
  CreateReservationDto,
  ReservationResponseDto,
} from './dto/create-reservation.dto.js';
import { CancelReservationDto } from './dto/reservation.dto.js';
import {
  ApiStandardResponse,
  ApiStandardArrayResponse,
  ApiErrorResponses,
  ApiConflictResponse,
} from '../../common/decorators/api-response.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@ApiTags('Reservations')
@Controller('events/:eventId/reservations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reserve seats with optimistic locking',
    description: `
Creates seat reservations with version checking and partial success handling.

**Features:**
- 🔒 Optimistic locking prevents race conditions
- ⚡ Partial success: reserves what it can, reports what failed
- ⏱️  Auto-expires after ${process.env.RESERVATION_TIMEOUT_MINUTES || 10} minutes
- 🎯 Atomic per-seat operations with distributed locks

**Optimistic Locking:**
Each seat has a version number that must match for updates to succeed.
If version mismatch occurs, client should refresh seat map and retry.

**Request Flow:**
1. Client gets seat map with current versions
2. User selects seats
3. Client sends reservation with seat IDs + versions
4. Backend validates each seat version atomically
5. Returns: { reservedSeatIds: [], failedSeats: [] }

**Response Scenarios:**
- ✅ Full success: All seats reserved, no failedSeats
- ⚠️  Partial success: Some reserved, some failed (with reasons)
- ❌ Complete failure: No seats reserved (409 Conflict)

**Failure Reasons:**
- "Seat was modified by another user (stale version)"
- "Seat is reserved"
- "Seat is booked"
- "Seat is currently locked by another request"
    `,
  })
  @ApiStandardResponse(
    201,
    'Seats reserved successfully',
    ReservationResponseDto,
  )
  @ApiConflictResponse('No seats could be reserved')
  @ApiErrorResponses()
  async reserveSeats(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Request() req: { user?: { sub?: string; id?: string } },
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ReservationResponseDto> {
    const userId = (req.user?.sub || req.user?.id) as string;

    return this.reservationService.reserveSeatsWithOptimisticLocking(
      eventId,
      userId,
      createReservationDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a reservation',
    description: `
Cancels an active reservation and releases the seats back to available pool.

**Use Cases:**
- User changes their mind before payment
- Need to select different seats
- Session timeout requires fresh reservation

**What happens:**
1. Validates reservation is active and belongs to user
2. Releases seats back to AVAILABLE status
3. Updates reservation status to CANCELLED
4. Clears seat reservation metadata

**Important:**
- Only ACTIVE reservations can be cancelled
- Users can only cancel their own reservations
- Seats immediately become available for others
    `,
  })
  @ApiStandardResponse(200, 'Reservation cancelled successfully')
  @ApiErrorResponses()
  async cancelReservation(
    @Param('id') reservationId: string,
    @Body() cancelDto: CancelReservationDto,
  ): Promise<null> {
    await this.reservationService.cancelReservation(
      reservationId,
      cancelDto.userId,
    );
    return null;
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Get user reservations',
    description: `
Retrieves all active (non-expired) reservations for a user.

**Perfect for:**
- Showing user's current cart/selections
- Countdown timer displays
- "Complete your booking" reminders

**Returns:**
- Only ACTIVE reservations (not expired or cancelled)
- Only reservations with future expiry times
- Sorted by creation date (newest first)
- Includes seat numbers and expiry countdown

**Note:**
- Expired reservations are excluded automatically
- Background cleanup runs every minute to expire old reservations
    `,
  })
  @ApiStandardArrayResponse(
    200,
    'User reservations retrieved',
    ReservationResponseDto,
  )
  @ApiErrorResponses()
  async getUserReservations(
    @Param('userId') userId: string,
  ): Promise<ReservationResponseDto[]> {
    return this.reservationService.getUserReservations(userId);
  }
}
