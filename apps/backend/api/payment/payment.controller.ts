import {
  Controller,
  Post,
  Get,
  Param,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentService } from './payment.service.js';
import { PaymentMethod } from './strategies/payment-strategy.interface.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import {
  ApiStandardResponse,
  ApiErrorResponses,
} from '../../common/decorators/api-response.decorator.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly paymentService: PaymentService) {}

  // ---------------------------------------------------------------------------
  // Public — Webhook (no auth; security via HMAC signature)
  // ---------------------------------------------------------------------------

  /**
   * Paystack webhook endpoint.
   *
   * Register this URL in your Paystack dashboard:
   *   https://dashboard.paystack.com/#/settings/developer
   *
   * Every event is validated via HMAC-SHA512 before being processed.
   */
  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Paystack webhook receiver',
    description: `
Receives and processes webhook events from Paystack.

**Security:** Each request is authenticated via an HMAC-SHA512 signature in
the \`x-paystack-signature\` header. Requests with invalid signatures are
silently dropped.

**Required Paystack events to enable in your dashboard:**
- \`charge.success\`
- \`charge.failed\`
- \`transfer.success\`
- \`transfer.failed\`
- \`transfer.reversed\`
    `,
  })
  @ApiHeader({
    name: 'x-paystack-signature',
    description: 'HMAC-SHA512 signature of the raw request body',
    required: true,
  })
  async paystackWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-paystack-signature') signature: string,
  ): Promise<{ received: boolean }> {
    if (!signature) {
      this.logger.warn('Paystack webhook received without signature header');
      // Return 200 to prevent Paystack from retrying; we just ignore it
      return { received: false };
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body unavailable');
    }

    await this.paymentService.handleWebhook(
      { body: rawBody, signature },
      PaymentMethod.PAYSTACK,
    );

    return { received: true };
  }

  // ---------------------------------------------------------------------------
  // Authenticated endpoints
  // ---------------------------------------------------------------------------

  @Get('verify/:reference')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify a Paystack payment by reference',
    description: `
Queries Paystack to retrieve the current status of a transaction.

Use this after the user completes payment on Paystack's hosted page and is
redirected back to your application. The \`reference\` is the \`paymentId\`
returned from \`POST /bookings/confirm\`.
    `,
  })
  @ApiParam({
    name: 'reference',
    description: 'Paystack transaction reference (paymentId)',
    example: 'idem_abc123',
  })
  @ApiStandardResponse(200, 'Payment verification result')
  @ApiErrorResponses()
  async verifyPayment(@Param('reference') reference: string) {
    return this.paymentService.verifyPayment(reference, PaymentMethod.PAYSTACK);
  }

  @Get('methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List available payment methods',
    description: 'Returns all registered payment strategies.',
  })
  @ApiStandardResponse(200, 'Available payment methods')
  getAvailableMethods(): { methods: PaymentMethod[] } {
    return { methods: this.paymentService.getAvailableMethods() };
  }
}
