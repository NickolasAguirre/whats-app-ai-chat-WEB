import { MonoTypeOperatorFunction, delay } from 'rxjs';

export const MOCK_LATENCY_MS = 400;

export function withMockLatency<T>(): MonoTypeOperatorFunction<T> {
  return delay(MOCK_LATENCY_MS);
}
