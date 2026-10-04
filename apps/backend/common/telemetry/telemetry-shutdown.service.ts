import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { shutdownTelemetry } from '../../instrumentation.js';

/**
 * Flushes OpenTelemetry (traces, metrics, logs) when Nest shuts down.
 *
 * Runs in onApplicationShutdown — after every module's onModuleDestroy — so
 * logs emitted while other modules close (e.g. the PostHog analytics flush)
 * are still exported. Requires app.enableShutdownHooks() in main.ts.
 */
@Injectable()
export class TelemetryShutdownService implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await shutdownTelemetry();
  }
}
