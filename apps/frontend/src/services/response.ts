export interface ApiEnvelope<T> {
  data: T;
}

/**
 * Supports both plain { data } and nested { data: { data } } backend envelopes.
 */
export function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as Record<string, unknown>)) {
    const first = (payload as ApiEnvelope<unknown>).data;

    if (first && typeof first === 'object' && 'data' in (first as Record<string, unknown>)) {
      return (first as ApiEnvelope<T>).data;
    }

    return first as T;
  }

  return payload as T;
}
