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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReservationService } from './reservation.service.js';
import {
  CreateReservationDto,
 ReservationResponseDto,
  CancelReservationDto,
} from './dto/reservation.dto.js';
import { ApiResponseDto } from '../../common/dto/api-response.dto.js';
import {
  ApiStandardResponse,
  ApiStandardArrayResponse,
  ApiErrorResponses,
  ApiConflictResponse,
} from '../../common/decorators/api-response.decorator.js';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Reserve seats for an event',
    description: `
Creates seat reservations with automatic expiry and distributed locking.

**Features:**
- ⏰ Auto-expiry after ${process.env.RESERVATION_TIMEOUT_MINUTES || '10'} minutes
- 🔐 Sorted locking to prevent deadlocks
- 🛡️ Race condition protection via distributed locks
- 🧹 Automatic cleanup of expired reservations

**Process Flow:**
1. Validates all requested seats exist and are available
2. Acquires distributed locks in sorted order (deadlock prevention)
3. Updates seat status to RESERVED
4. Creates reservation records with expiry time
5. Returns reservation details with countdown

**Important:**
- Reservations expire automatically if not confirmed
- Multiple seats are reserved atomically (all or nothing)
- Seat numbers must be valid for the event

**Error Scenarios:**
- 404: One or more seats not found
- 409: Seat(s) already reserved or unavailable
- 500: System error (all reservations rolled back)
    `,
  })
  @ApiStandardArrayResponse(201, 'Seats reserved successfully', ReservationResponseDto)
  @ApiErrorResponses()
  @ApiConflictResponse('Seat already reserved or unavailable')
  async reserveSeats(
    @Body() createReservationDto: CreateReservationDto,
  ): Promise<ApiResponseDto<ReservationResponseDto[]>> {
    const data = await this.reservationService.reserveSeats(createReservationDto);
    return new ApiResponseDto(
      data,
      'Seats reserved successfully',
      HttpStatus.CREATED,
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
  ): Promise<ApiResponseDto<null>> {
    await this.reservationService.cancelReservation(
      reservationId,
      cancelDto.userId,
    );
    return new ApiResponseDto(null, 'Reservation cancelled successfully');
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
  @ApiStandardArrayResponse(200, 'User reservations retrieved', ReservationResponseDto)
  @ApiErrorResponses()
  async getUserReservations(
    @Param('userId') userId: string,
  ): Promise<ApiResponseDto<ReservationResponseDto[]>> {
    const data = await this.reservationService.getUserReservations(userId);
    return new ApiResponseDto(data, 'User reservations retrieved successfully');
  }
}
