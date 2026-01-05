import { describe, expect, it, vi } from 'vitest';
import { type ClockInit, clock, defaultClock } from './clock.js';

describe('clock', () => {
  it('should create clock with defaults', () => {
    const c = clock();
    expect(typeof c.traceZeroEpochUs).toBe('number');
    expect(typeof c.pid).toBe('number');
    expect(typeof c.tid).toBe('number');
    expect(typeof c.fromEpochMs).toBe('function');
    expect(typeof c.fromEpochUs).toBe('function');
    expect(typeof c.fromPerfMs).toBe('function');
  });

  it('should use custom trace zero epoch', () => {
    const c = clock({ traceZeroEpochUs: 1000000 });
    expect(c.traceZeroEpochUs).toBe(1000000);
  });

  it('should use custom pid and tid', () => {
    const c = clock({ pid: 123, tid: 456 });
    expect(c.pid).toBe(123);
    expect(c.tid).toBe(456);
  });

  it('should support performance clock preference setting', () => {
    const c = clock({ preferPerformanceClock: false });
    expect(c.timeOriginMs).toBeDefined();
  });

  it('should convert epoch microseconds to trace microseconds', () => {
    const c = clock({ traceZeroEpochUs: 1000000 });
    expect(c.fromEpochUs(1000000)).toBe(0);
    expect(c.fromEpochUs(1001000)).toBe(1000);
    expect(c.fromEpochUs(999000)).toBe(-1000);
  });

  it('should convert epoch milliseconds to trace microseconds', () => {
    const c = clock({ traceZeroEpochUs: 1000000 });
    expect(c.fromEpochMs(1000)).toBe(0);
    expect(c.fromEpochMs(1001)).toBe(1000);
    expect(c.fromEpochMs(999)).toBe(-1000);
  });

  it('should convert performance milliseconds to trace microseconds', () => {
    const c = clock({ traceZeroEpochUs: 1000000 });

    if (c.timeOriginMs !== undefined) {
      expect(typeof c.fromPerfMs(0)).toBe('number');
      expect(typeof c.fromPerfMs(1000)).toBe('number');
    } else {
      expect(typeof c.fromPerfMs(0)).toBe('number');
    }
  });

  it('should convert entry start time to trace microseconds', () => {
    const c = clock();
    expect(typeof c.fromEntryStartTimeMs(0)).toBe('number');
    expect(typeof c.fromEntryStartTimeMs(1000)).toBe('number');
  });

  it('should convert Date.now() milliseconds to trace microseconds', () => {
    const c = clock();
    expect(typeof c.fromDateNowMs(1000000)).toBe('number');
    expect(typeof c.fromDateNowMs(2000000)).toBe('number');
  });

  it('should have valid defaultClock export', () => {
    expect(typeof defaultClock.traceZeroEpochUs).toBe('number');
    expect(typeof defaultClock.pid).toBe('number');
    expect(typeof defaultClock.tid).toBe('number');
    expect(typeof defaultClock.fromEpochMs).toBe('function');
    expect(typeof defaultClock.fromEpochUs).toBe('function');
    expect(typeof defaultClock.fromPerfMs).toBe('function');
  });

  it('should have reasonable trace zero epoch for defaultClock', () => {
    const now = Date.now() * 1000;
    expect(defaultClock.traceZeroEpochUs).toBeGreaterThan(now - 1000000);
    expect(defaultClock.traceZeroEpochUs).toBeLessThan(now + 1000000);
  });

  it('should maintain conversion consistency', () => {
    const c = clock({ traceZeroEpochUs: 1000000 });

    const epochUs = 2000000;
    const epochMs = 2000;

    expect(c.fromEpochUs(epochUs)).toBe(epochUs - 1000000);
    expect(c.fromEpochMs(epochMs)).toBe(epochMs * 1000 - 1000000);

    expect(c.fromEpochUs(1000000)).toBe(0);
    expect(c.fromEpochMs(1000)).toBe(0);
  });

  it('should round microseconds correctly', () => {
    const c = clock({ traceZeroEpochUs: 1000000 });

    expect(c.fromEpochUs(1000000.4)).toBe(0);
    expect(c.fromEpochUs(1000000.5)).toBe(1);
    expect(c.fromEpochUs(1000000.9)).toBe(1);
  });
});
