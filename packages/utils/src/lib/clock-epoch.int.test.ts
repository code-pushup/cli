import process from 'node:process';
import { threadId } from 'node:worker_threads';
import { describe, expect, it } from 'vitest';
import { defaultClock, epochClock } from './clock-epoch.js';

describe('epochClock', () => {
  it('should create epoch clock with defaults', () => {
    const c = epochClock();
    expect(c).toStrictEqual(
      expect.objectContaining({
        tid: threadId,
        pid: process.pid,
        timeOriginMs: performance.timeOrigin,
      }),
    );
    expect(c.fromEpochMs).toBeFunction();
    expect(c.fromEpochUs).toBeFunction();
    expect(c.fromPerfMs).toBeFunction();
    expect(c.fromEntryStartTimeMs).toBeFunction();
    expect(c.fromDateNowMs).toBeFunction();
  });

  it('should support performance clock by default for epochNowUs', () => {
    const c = epochClock();
    expect(c.timeOriginMs).toBe(performance.timeOrigin);
    const nowUs = c.epochNowUs();
    expect(nowUs).toBe(Math.round(nowUs));
    const expectedUs = Date.now() * 1000;

    expect(nowUs).toBeWithin(expectedUs - 2000, expectedUs + 1000);
  });

  it('should convert epoch milliseconds to microseconds correctly', () => {
    const c = epochClock();
    const epochMs = Date.now();

    const result = c.fromEpochMs(epochMs);
    expect(result).toBeInteger();
    expect(result).toBe(Math.round(epochMs * 1000));
  });

  it('should convert epoch microseconds to microseconds correctly', () => {
    const c = epochClock();
    const epochUs = Date.now() * 1000;
    const expectedUs = Math.round(epochUs);

    const result = c.fromEpochUs(epochUs);
    expect(result).toBe(expectedUs);
    expect(result).toBe(Math.round(result));
  });

  it('should convert performance milliseconds to epoch microseconds correctly', () => {
    const c = epochClock();
    const perfMs = performance.now();
    const expectedUs = Math.round((c.timeOriginMs + perfMs) * 1000);

    const result = c.fromPerfMs(perfMs);
    expect(result).toBe(expectedUs);
    expect(result).toBeInteger();
  });

  it('should convert entry start time milliseconds to epoch microseconds correctly', () => {
    const c = epochClock();
    const entryStartMs = performance.mark('fromPerfMs').startTime;
    const expectedUs = Math.round((c.timeOriginMs + entryStartMs) * 1000);

    const result = c.fromEntryStartTimeMs(entryStartMs);
    expect(result).toBe(expectedUs);
    expect(result).toBe(Math.round(result));
  });

  it('should convert Date.now milliseconds to epoch microseconds correctly', () => {
    const c = epochClock();
    const dateNowMs = Date.now();

    const result = c.fromDateNowMs(dateNowMs);
    expect(result).toBe(Math.round(dateNowMs * 1000));
    expect(result).toBe(Math.round(result));
  });
});

describe('defaultClock', () => {
  it('should have valid defaultClock export', () => {
    const c = defaultClock;
    expect(c).toStrictEqual(
      expect.objectContaining({
        tid: threadId,
        pid: process.pid,
        timeOriginMs: performance.timeOrigin,
      }),
    );

    expect(c.fromEpochMs).toBeFunction();
    expect(c.fromEpochUs).toBeFunction();
    expect(c.fromPerfMs).toBeFunction();
    expect(c.fromEntryStartTimeMs).toBeFunction();
    expect(c.fromDateNowMs).toBeFunction();
  });
});
