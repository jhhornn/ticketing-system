import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request context stored throughout the request lifecycle
 *
 * WHY HIGH CARDINALITY FIELDS:
 * - request_id: Trace a single request across multiple services/logs
 * - user_id: Query all actions by a specific user
 * - session_id: Track user session behavior
 *
 * WHY BUSINESS CONTEXT:
 * - user_tier: Answer "do premium users hit more errors?"
 * - user_email: Contact affected users
 * - feature_flags: Correlate issues with experiments
 */
export interface RequestContext {
  // High cardinality fields - enable powerful querying
  request_id: string;
  user_id?: string;
  session_id?: string;

  // Business context - understand WHO is affected
  user_email?: string;
  user_tier?: string; // 'free', 'premium', 'enterprise'
  user_role?: string; // 'customer', 'organizer', 'admin'

  // Request metadata
  method?: string;
  path?: string;
  user_agent?: string;
  ip_address?: string;

  // Feature flags for A/B testing correlation
  feature_flags?: Record<string, boolean>;

  // Start time for duration calculation
  start_time: number;

  // Allow additional dynamic context
  [key: string]: any;
}

/**
 * RequestContextService - Maintains request-scoped context
 *
 * WHY: Enables you to access request context anywhere in your code
 * without passing it through every function. The context follows
 * the async execution path automatically.
 *
 * OBSERVABILITY BENEFIT: Every log can include request_id and user_id
 * without manual propagation. This enables:
 * - Tracing a single request across all logs
 * - Querying all errors for a specific user
 * - Correlating user behavior with system issues
 *
 * @example
 * // In middleware: set context
 * this.requestContext.set({ request_id: '123', user_id: '456' });
 *
 * // In any service: get context
 * const context = this.requestContext.get();
 * logger.info({ ...context, action: 'booking_created' });
 */
@Injectable()
export class RequestContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

  /**
   * Initialize a new request context
   *
   * WHY: Called by middleware at the start of each request.
   * Creates a new AsyncLocalStorage context that follows the request
   * through all async operations.
   *
   * @param initialContext - Base context from the HTTP request
   * @returns The created context
   */
  run<T>(initialContext: Partial<RequestContext>, callback: () => T): T {
    const context: RequestContext = {
      request_id: initialContext.request_id || uuidv4(),
      start_time: Date.now(),
      ...initialContext,
    };

    return this.asyncLocalStorage.run(context, callback);
  }

  /**
   * Get the current request context
   *
   * WHY: Access request/user context from anywhere in your code.
   * Returns undefined if called outside a request context.
   *
   * @returns Current request context or undefined
   */
  get(): RequestContext | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Get current request context or throw
   *
   * WHY: Use when context is required (e.g., in authenticated routes).
   * Fails fast if context is missing.
   */
  getOrThrow(): RequestContext {
    const context = this.get();
    if (!context) {
      throw new Error(
        'Request context not found - ensure middleware is configured',
      );
    }
    return context;
  }

  /**
   * Update the current request context
   *
   * WHY: Add context as you learn more about the request.
   * For example, after authentication, add user_id and user_tier.
   *
   * @example
   * // After authentication
   * this.requestContext.update({
   *   user_id: user.id,
   *   user_tier: user.subscription,
   *   user_role: user.role,
   * });
   */
  update(updates: Partial<RequestContext>): void {
    const current = this.get();
    if (current) {
      Object.assign(current, updates);
    }
  }

  /**
   * Add business context to the current request
   *
   * WHY: Track business-specific data for observability.
   * Examples: cart value, event type, booking status
   *
   * @example
   * this.requestContext.addBusinessContext({
   *   event_id: 123,
   *   event_type: 'concert',
   *   cart_total_cents: 249900,
   *   seat_count: 2,
   * });
   */
  addBusinessContext(context: Record<string, any>): void {
    const current = this.get();
    if (current) {
      Object.assign(current, context);
    }
  }

  /**
   * Get request duration in milliseconds
   *
   * WHY: Performance monitoring - identify slow requests.
   * Included automatically in wide events.
   */
  getDuration(): number {
    const context = this.get();
    return context ? Date.now() - context.start_time : 0;
  }

  /**
   * Generate a new request ID
   *
   * WHY: Create unique identifiers for operations.
   * Use this for idempotency keys or sub-operation tracking.
   */
  generateId(): string {
    return uuidv4();
  }
}
