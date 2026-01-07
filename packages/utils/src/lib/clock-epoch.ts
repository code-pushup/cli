import process from 'node:process';
import { threadId } from 'node:worker_threads';

export type Microseconds = number;
export type Milliseconds = number;
export type EpochMilliseconds = number;

const msToUs = (ms: number): Microseconds => Math.round(ms * 1000);
const usToUs = (us: number): Microseconds => Math.round(us);

/**
 * Defines clock utilities for time conversions.
 * Handles time origins in NodeJS and the Browser
 * Provides process and thread IDs.
 * @param init
 */
export type EpochClockOptions = {
  pid?: number;
  tid?: number;
};

/**
 * Creates epoch-based clock utility.
 * Epoch time has been the time since January 1, 1970 (UNIX epoch).
 * Date.now gives epoch time in milliseconds.
 * performance.now() + performance.timeOrigin when available is used for higher precision.
 */
export function epochClock(init: EpochClockOptions = {}) {
  const pid = init.pid ?? process.pid;
  const tid = init.tid ?? threadId;

  const timeOriginMs = performance.timeOrigin;

  const epochNowUs = (): Microseconds =>
    msToUs(timeOriginMs + performance.now());

  const fromEpochUs = usToUs;

  const fromEpochMs = msToUs;

  const fromPerfMs = (perfMs: Milliseconds): Microseconds =>
    msToUs(timeOriginMs + perfMs);

  const fromEntryStartTimeMs = fromPerfMs;
  const fromDateNowMs = fromEpochMs;

  return {
    timeOriginMs,
    pid,
    tid,

    epochNowUs,
    msToUs,
    usToUs,

    fromEpochMs,
    fromEpochUs,
    fromPerfMs,
    fromEntryStartTimeMs,
    fromDateNowMs,
  };
}

export const defaultClock = epochClock();
