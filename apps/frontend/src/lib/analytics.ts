import posthog from 'posthog-js';

/**
 * Product analytics (PostHog).
 *
 * Every call is a no-op when VITE_POSTHOG_KEY is not set, so local development
 * and preview builds work without an analytics project.
 *
 * Use the AnalyticsEvents names below rather than ad-hoc strings so events stay
 * consistent across the app (and with the backend, which sends the
 * authoritative booking/payment events using the same user id).
 */

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://us.i.posthog.com';

/** Shared with PostHog Logs & Metrics so browser and API telemetry can be filtered apart. */
const SERVICE_NAME = 'ticketing-web';
const ENVIRONMENT = import.meta.env.MODE;

/** Console levels worth exporting; debug/info noise stays in the browser. */
const EXPORTED_LOG_LEVELS = new Set(['warn', 'error', 'fatal']);

/**
 * Collapse ids that the SDK's default `url.template` keeps (it only replaces
 * all-digit / uuid segments), so each booking or payment reference doesn't
 * become its own metric series.
 */
const REFERENCE_ROUTE_PATTERN = /\/(bookings\/reference|payments\/verify)\/[^/?#]+/;

function toUrlTemplate(url: string): string | undefined {
  try {
    const { pathname } = new URL(url, window.location.origin);
    return REFERENCE_ROUTE_PATTERN.test(pathname)
      ? pathname.replace(REFERENCE_ROUTE_PATTERN, '/$1/:ref')
      : undefined;
  } catch {
    return undefined;
  }
}

let enabled = false;

export const AnalyticsEvents = {
  userSignedUp: 'user_signed_up',
  userLoggedIn: 'user_logged_in',
  seatsReserved: 'seats_reserved',
  reservationFailed: 'reservation_failed',
  discountApplied: 'discount_applied',
  checkoutSubmitted: 'checkout_submitted',
  checkoutFailed: 'checkout_failed',
  paystackRedirected: 'paystack_redirected',
  paymentVerified: 'payment_verified',
} as const;

export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export interface AnalyticsUser {
  id: string;
  role?: string;
}

export function initAnalytics(): void {
  if (!POSTHOG_KEY || enabled) {
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: '2026-08-30',
    // SPA: record a pageview on every client-side route change
    capture_pageview: 'history_change',
    capture_pageleave: true,
    // Only create person profiles for logged-in users (cheaper, less PII)
    person_profiles: 'identified_only',
    session_recording: {
      // Never record what people type (passwords, discount codes, etc.)
      maskAllInputs: true,
    },
    // Errors are better handled by an error tracker (e.g. Sentry)
    capture_exceptions: false,

    // PostHog Logs: console.warn/error from the browser, linked to the
    // session replay and person that produced them
    logs: {
      serviceName: SERVICE_NAME,
      environment: ENVIRONMENT,
      captureConsoleLogs: true,
      beforeSend: (record) => (EXPORTED_LOG_LEVELS.has(record.level ?? 'info') ? record : null),
    },

    // PostHog Metrics: latency histogram for every API call the browser makes
    metrics: {
      serviceName: SERVICE_NAME,
      environment: ENVIRONMENT,
      network: {
        attributes: (request) => {
          const template = toUrlTemplate(request.url);
          return template ? { 'url.template': template } : undefined;
        },
      },
    },
  });

  enabled = true;
}

/** Tie this browser to the logged-in user (same id the backend uses). */
export function identifyUser(user: AnalyticsUser): void {
  if (!enabled) return;
  // Only non-sensitive traits by default; add email/name here if your privacy
  // policy covers sending them to PostHog.
  posthog.identify(user.id, { role: user.role });
}

/** Call on logout so the next person on this device isn't merged into this one. */
export function resetUser(): void {
  if (!enabled) return;
  posthog.reset();
}

export function track(event: AnalyticsEvent | string, properties?: Record<string, unknown>): void {
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, properties ?? {});
  }
  if (!enabled) return;
  posthog.capture(event, properties);
}
