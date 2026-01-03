// clock.ts
// Professional trace-clock helper for Chrome/DevTools traces (ts/dur in µs).
import process from 'node:process';
import { threadId } from 'node:worker_threads';

export type Microseconds = number;
export type Milliseconds = number;
export type EpochMilliseconds = number;

export interface ClockInit {
  /**
   * Trace origin in epoch µs. Pass the SAME value to all processes that write into one file.
   * Recommended parent value: Date.now() * 1000
   */
  traceZeroEpochUs?: Microseconds;

  pid?: number;
  tid?: number;

  /**
   * If true (default), prefers performance.timeOrigin + performance.now() when available.
   * Falls back to Date.now() otherwise.
   */
  preferPerformanceClock?: boolean;
}

const hasPerf = (): boolean =>
  typeof performance !== 'undefined' && typeof performance.now === 'function';
const hasTimeOrigin = (): boolean =>
  hasPerf() && typeof (performance as any).timeOrigin === 'number';

const msToUs = (ms: number): Microseconds => Math.round(ms * 1000);
const usToUs = (us: number): Microseconds => Math.round(us);

export function clock(init: ClockInit = {}) {
  const preferPerformanceClock = init.preferPerformanceClock ?? true;

  const pid = init.pid ?? process.pid;
  const tid = init.tid ?? threadId;

  /**
   * Trace origin in epoch µs. Pass the SAME value to all processes that write into one file.
   * Recommended parent value: Date.now() * 1000
   * This MUST be shared across processes if they write to the same trace.
   */
  const traceZeroEpochUs: Microseconds =
    init.traceZeroEpochUs ?? msToUs(Date.now());

  const timeOriginMs = hasTimeOrigin()
    ? ((performance as any).timeOrigin as number)
    : undefined;

  // epoch-us "now" derived from a monotonic source when possible
  const epochNowUs = (): Microseconds => {
    if (preferPerformanceClock && timeOriginMs !== undefined) {
      // Stable epoch time browsers + Node perf_hooks
      return msToUs(timeOriginMs + performance.now());
    }
    // Fallback: best-effort epoch time (may jump around if system clock changes).
    return msToUs(Date.now());
  };

  const fromEpochUs = (epochUs: Microseconds): Microseconds =>
    usToUs(epochUs - traceZeroEpochUs);

  const fromEpochMs = (epochMs: EpochMilliseconds): Microseconds =>
    fromEpochUs(msToUs(epochMs));

  const fromPerfMs = (perfMs: Milliseconds): Microseconds => {
    if (timeOriginMs === undefined) {
      // Without timeOrigin we cannot map perf-relative to epoch;
      // "now - perf.now()" is only safe when used within the same process.
      const approxEpochUs = epochNowUs() - msToUs(performance.now() - perfMs);
      return fromEpochUs(approxEpochUs);
    }
    return fromEpochUs(msToUs(timeOriginMs + perfMs));
  };

  const fromEntryStartTimeMs = (startTimeMs: Milliseconds): Microseconds =>
    fromPerfMs(startTimeMs);
  const fromDateNowMs = (dateNowMs: EpochMilliseconds): Microseconds =>
    fromEpochMs(dateNowMs);

  return {
    traceZeroEpochUs,
    timeOriginMs,
    pid,
    tid,

    fromEpochMs,
    fromEpochUs,
    fromPerfMs,
    fromEntryStartTimeMs,
    fromDateNowMs,
  };
}

export const defaultClock = clock();
