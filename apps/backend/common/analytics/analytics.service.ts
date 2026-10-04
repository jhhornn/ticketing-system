import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PostHog } from 'posthog-node';

/**
 * Server-side product analytics (PostHog).
 *
 * The backend sends the events that must be accurate — bookings confirmed,
 * payments settled, seats released — because they happen here (sometimes in
 * a webhook with no browser involved) and can't be blocked by ad blockers.
 * Events use the user's id as distinctId, the same id the frontend passes to
 * posthog.identify(), so both sides land on one person in PostHog.
 *
 * A no-op when POSTHOG_API_KEY is not set.
 */
export const ServerAnalyticsEvents = {
  userRegistered: 'user_registered',
  bookingCreated: 'booking_created',
  bookingConfirmed: 'booking_confirmed',
  bookingReleased: 'booking_released',
  paymentRefundedUnfulfilled: 'payment_refunded_unfulfilled',
} as const;

export type ServerAnalyticsEvent =
  (typeof ServerAnalyticsEvents)[keyof typeof ServerAnalyticsEvents];

const DEFAULT_POSTHOG_HOST = 'https://us.i.posthog.com';
const SHUTDOWN_TIMEOUT_MS = 5000;

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly client: PostHog | null;

  constructor() {
    const apiKey = process.env.POSTHOG_API_KEY;
    this.client = apiKey
      ? new PostHog(apiKey, {
          host: process.env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST,
        })
      : null;

    if (!this.client) {
      this.logger.log('POSTHOG_API_KEY not set — server analytics disabled');
    }
  }

  capture(
    distinctId: string,
    event: ServerAnalyticsEvent,
    properties: Record<string, unknown> = {},
  ): void {
    if (!this.client) return;

    try {
      this.client.capture({
        distinctId,
        event,
        properties: { ...properties, source: 'backend' },
      });
    } catch (error) {
      // Analytics must never break a booking or payment flow
      this.logger.warn(
        `Failed to capture ${event}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Flush queued events before the process exits
    await this.client?.shutdown(SHUTDOWN_TIMEOUT_MS);
  }
}
