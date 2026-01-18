import { describe, expect, it } from 'vitest';
import { defaultClock, epochClock } from './clock-epoch.js';

describe('epochClock', () => {
  it('should create epoch clock with defaults', () => {
    const c = epochClock();
    expect(c.timeOriginMs).toBe(1_700_000_000_000);
    expect(c.tid).toBe(2);
    expect(c.pid).toBe(10_001);
    expect(c.fromEpochMs).toBeFunction();
    expect(c.fromEpochUs).toBeFunction();
    expect(c.fromPerfMs).toBeFunction();
    expect(c.fromEntry).toBeFunction();
    expect(c.fromEntryStartTimeMs).toBeFunction();
    expect(c.fromDateNowMs).toBeFunction();
  });

  it('should use pid options', () => {
    expect(epochClock({ pid: 999 })).toStrictEqual(
      expect.objectContaining({
        pid: 999,
      }),
    );
  });

  it('should use tid options', () => {
    expect(epochClock({ tid: 888 })).toStrictEqual(
      expect.objectContaining({
        tid: 888,
      }),
    );
  });

  it('should support performance clock by default for epochNowUs', () => {
    const c = epochClock();
    expect(c.timeOriginMs).toBe(1_700_000_000_000);
    expect(c.epochNowUs()).toBe(1_700_000_000_000_000);
  });

  it.each([
    [1_000_000_000, 1_000_000_000],
    [1_001_000_000, 1_001_000_000],
    [999_000_000, 999_000_000],
  ])('should convert epoch microseconds to microseconds', (us, result) => {
    const c = epochClock();
    expect(c.fromEpochUs(us)).toBe(result);
  });

  it.each([
    [1_000_000, 1_000_000_000],
    [1_001_000.5, 1_001_000_500],
    [999_000.4, 999_000_400],
  ])('should convert epoch milliseconds to microseconds', (ms, result) => {
    const c = epochClock();
    expect(c.fromEpochMs(ms)).toBe(result);
  });

  it.each([
    [0, 1_700_000_000_000_000],
    [1000, 1_700_000_001_000_000],
  ])(
    'should convert performance milliseconds to microseconds',
    (perfMs, expected) => {
      expect(epochClock().fromPerfMs(perfMs)).toBe(expected);
    },
  );

  it('should convert entry start time to microseconds', () => {
    const c = epochClock();
    expect([
      c.fromEntryStartTimeMs(0),
      c.fromEntryStartTimeMs(1000),
    ]).toStrictEqual([c.fromPerfMs(0), c.fromPerfMs(1000)]);
  });

  it('should convert performance mark to microseconds', () => {
    const markEntry = {
      name: 'test-mark',
      entryType: 'mark',
      startTime: 1000,
      duration: 0,
    } as PerformanceMark;

    expect(defaultClock.fromEntry(markEntry)).toBe(
      defaultClock.fromPerfMs(1000),
    );
    expect(defaultClock.fromEntry(markEntry, true)).toBe(
      defaultClock.fromPerfMs(1000),
    );
  });

  it('should convert performance measure to microseconds', () => {
    const measureEntry = {
      name: 'test-measure',
      entryType: 'measure',
      startTime: 1000,
      duration: 500,
    } as PerformanceMeasure;

    expect(defaultClock.fromEntry(measureEntry)).toBe(
      defaultClock.fromPerfMs(1000),
    );
    expect(defaultClock.fromEntry(measureEntry, false)).toBe(
      defaultClock.fromPerfMs(1000),
    );
    expect(defaultClock.fromEntry(measureEntry, true)).toBe(
      defaultClock.fromPerfMs(1500),
    );
  });

  it('should convert Date.now() milliseconds to microseconds', () => {
    const c = epochClock();
    expect([
      c.fromDateNowMs(1_000_000),
      c.fromDateNowMs(2_000_000),
    ]).toStrictEqual([1_000_000_000, 2_000_000_000]);
  });

  it('should maintain conversion consistency', () => {
    const c = epochClock();

    expect({
      fromEpochUs_2B: c.fromEpochUs(2_000_000_000),
      fromEpochMs_2M: c.fromEpochMs(2_000_000),
      fromEpochUs_1B: c.fromEpochUs(1_000_000_000),
      fromEpochMs_1M: c.fromEpochMs(1_000_000),
    }).toStrictEqual({
      fromEpochUs_2B: 2_000_000_000,
      fromEpochMs_2M: 2_000_000_000,
      fromEpochUs_1B: 1_000_000_000,
      fromEpochMs_1M: 1_000_000_000,
    });
  });

  it.each([
    [1_000_000_000.1, 1_000_000_000],
    [1_000_000_000.4, 1_000_000_000],
    [1_000_000_000.5, 1_000_000_001],
    [1_000_000_000.9, 1_000_000_001],
  ])('should round microseconds correctly', (value, result) => {
    const c = epochClock();
    expect(c.fromEpochUs(value)).toBe(result);
  });
});

describe('defaultClock', () => {
  it('should have valid defaultClock export', () => {
    expect({
      tid: typeof defaultClock.tid,
      timeOriginMs: typeof defaultClock.timeOriginMs,
    }).toStrictEqual({
      tid: 'number',
      timeOriginMs: 'number',
    });
  });
});
