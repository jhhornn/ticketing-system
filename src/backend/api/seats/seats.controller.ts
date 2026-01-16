import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SeatsService } from './seats.service.js';
import {
  ApiStandardResponse,
  ApiErrorResponses,
} from '../../common/decorators/api-response.decorator.js';
import { SeatMapResponseDto } from './dto/seat-map-response.dto.js';

@ApiTags('Seats')
@Controller('events/:eventId/seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  // Explicitly typed property to ensure type safety
  private get service(): SeatsService {
    return this.seatsService;
  }

  @Get()
  @ApiOperation({
    summary: 'Get seat map for an event',
    description: `
Returns optimized seat map grouped by sections for efficient rendering.

**Features:**
- 🎭 Seats grouped by section for performance
- 🔒 Real-time status (AVAILABLE, RESERVED, BOOKED, BLOCKED)
- ⚡ Optimistic locking version included
- 💰 Pricing information per seat

**Use Cases:**
- Initial seat map rendering
- Polling for real-time updates
- Section-based filtering

**Performance:**
- Grouped response reduces payload size
- Client can render sections progressively
- Enables virtual scrolling for large venues
    `,
  })
  @ApiStandardResponse(
    200,
    'Seat map retrieved successfully',
    SeatMapResponseDto,
  )
  @ApiErrorResponses()
  async getSeats(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<SeatMapResponseDto> {
    return await this.seatsService.getSeatMap(eventId);
  }
}
