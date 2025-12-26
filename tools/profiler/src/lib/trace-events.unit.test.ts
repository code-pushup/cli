import { describe, expect, it } from 'vitest';
import {
  getFrameName,
  getFrameTreeNodeId,
  getRunTaskTraceEvent,
  getStartTracing,
  markToTraceEvent,
  measureToTraceEvents,
} from './trace-events.js';

describe('getFrameTreeNodeId', () => {
  it('should return correct frame tree node id for pid and tid', () => {
    expect(getFrameTreeNodeId(1, 2)).toBe(102);
    expect(getFrameTreeNodeId(10, 5)).toBe(1005);
    expect(getFrameTreeNodeId(0, 0)).toBe(0);
  });
});

describe('getFrameName', () => {
  it('should return correct frame name for pid and tid', () => {
    expect(getFrameName(1, 2)).toBe('FRAME0P1T2');
    expect(getFrameName(10, 5)).toBe('FRAME0P10T5');
    expect(getFrameName(0, 0)).toBe('FRAME0P0T0');
  });
});

describe('getStartTracing', () => {
  it('should create correct tracing start event', () => {
    const result = getStartTracing(1, 2, {
      traceStartTs: 123456,
      url: 'http://example.com',
    });

    expect(result).toEqual({
      cat: 'devtools.timeline',
      name: 'TracingStartedInBrowser',
      ph: 'i',
      pid: 1,
      tid: 2,
      ts: 123456,
      s: 't',
      args: {
        data: {
          frameTreeNodeId: 102,
          frames: [
            {
              frame: 'FRAME0P1T2',
              isInPrimaryMainFrame: true,
              isOutermostMainFrame: true,
              name: '',
              processId: 1,
              url: 'http://example.com',
            },
          ],
          persistentIds: true,
        },
      },
    });
  });
});

describe('getRunTaskTraceEvent', () => {
  it('should create correct run task trace event', () => {
    const result = getRunTaskTraceEvent(1, 2, {
      ts: 123456,
      dur: 1000,
    });

    expect(result).toEqual({
      args: {},
      cat: 'devtools.timeline',
      dur: 1000,
      name: 'RunTask',
      ph: 'X',
      pid: 1,
      tid: 2,
      ts: 123456,
    });
  });
});

describe('measureToTraceEvents', () => {
  it('should convert performance measure to trace events', () => {
    const measure = {
      name: 'test-measure',
      entryType: 'measure',
      startTime: 100,
      duration: 50,
    } as PerformanceMeasure;

    let idCounter = 0;
    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: idCounter++ }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      cat: 'blink.user_timing',
      name: 'test-measure',
      ph: 'b',
      pid: 1,
      tid: 2,
      ts: 100000, // 100 * 1000
      id2: { local: 0 },
      args: {},
    });

    expect(events[1]).toEqual({
      cat: 'blink.user_timing',
      name: 'test-measure',
      ph: 'e',
      pid: 1,
      tid: 2,
      ts: 150000, // (100 + 50) * 1000
      id2: { local: 0 },
      args: {},
    });
  });

  it('should handle measure with detail', () => {
    const measure: PerformanceMeasure = {
      name: 'test-measure',
      entryType: 'measure',
      startTime: 200,
      duration: 75,
      detail: { custom: 'data' },
    };

    let idCounter = 1;
    const ctx = {
      pid: 3,
      tid: 4,
      nextId2: () => ({ local: idCounter++ }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      cat: 'blink.user_timing',
      name: 'test-measure',
      ph: 'b',
      pid: 3,
      tid: 4,
      ts: 200000, // 200 * 1000
      id2: { local: 1 },
      args: {
        detail: '{"custom":"data"}',
      },
    });
    expect(events[1]).toEqual({
      cat: 'blink.user_timing',
      name: 'test-measure',
      ph: 'e',
      pid: 3,
      tid: 4,
      ts: 275000, // (200 + 75) * 1000
      id2: { local: 1 },
      args: {},
    });
  });

  it('should call nextId2 once per measure and use same id for begin and end', () => {
    const measure: PerformanceMeasure = {
      name: 'test-measure',
      entryType: 'measure',
      startTime: 0,
      duration: 100,
    };

    let callCount = 0;
    const ctx = {
      pid: 5,
      tid: 6,
      nextId2: () => {
        callCount++;
        return { local: `id-${callCount}` };
      },
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(callCount).toBe(1);
    expect(events[0].id2).toEqual({ local: 'id-1' });
    expect(events[1].id2).toEqual({ local: 'id-1' });
  });

  it('should handle measure with zero duration', () => {
    const measure: PerformanceMeasure = {
      name: 'instant-measure',
      entryType: 'measure',
      startTime: 500,
      duration: 0,
    };

    const ctx = {
      pid: 7,
      tid: 8,
      nextId2: () => ({ local: '0x1' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events[0].ts).toBe(500000);
    expect(events[1].ts).toBe(500000); // startTime + 0
  });

  it('should handle measure with null detail', () => {
    const measure: PerformanceMeasure = {
      name: 'null-detail-measure',
      entryType: 'measure',
      startTime: 100,
      duration: 50,
      detail: null as unknown as Record<string, unknown>,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'null-id' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events[0].args).toEqual({
      detail: 'null',
    });
    expect(events[1].args).toEqual({});
  });

  it('should handle measure with empty object detail', () => {
    const measure: PerformanceMeasure = {
      name: 'empty-detail-measure',
      entryType: 'measure',
      startTime: 200,
      duration: 75,
      detail: {},
    };

    const ctx = {
      pid: 3,
      tid: 4,
      nextId2: () => ({ local: 'empty-id' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events[0].args).toEqual({
      detail: '{}',
    });
    expect(events[1].args).toEqual({});
  });

  it('should handle measure with array detail', () => {
    const measure: PerformanceMeasure = {
      name: 'array-detail-measure',
      entryType: 'measure',
      startTime: 300,
      duration: 100,
      detail: [1, 2, 3] as unknown as Record<string, unknown>,
    };

    const ctx = {
      pid: 5,
      tid: 6,
      nextId2: () => ({ local: 'array-id' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events[0].args).toEqual({
      detail: '[1,2,3]',
    });
    expect(events[1].args).toEqual({});
  });

  it('should handle measure with decimal timestamps and round correctly', () => {
    const measure: PerformanceMeasure = {
      name: 'decimal-measure',
      entryType: 'measure',
      startTime: 100.4,
      duration: 50.6,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'decimal-id' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    // 100.4 * 1000 = 100400, rounded = 100400
    expect(events[0].ts).toBe(100400);
    // (100.4 + 50.6) * 1000 = 151000, rounded = 151000
    expect(events[1].ts).toBe(151000);
  });

  it('should handle measure with decimal timestamps rounding up', () => {
    const measure: PerformanceMeasure = {
      name: 'decimal-round-up-measure',
      entryType: 'measure',
      startTime: 100.6,
      duration: 50.7,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'round-up-id' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    // 100.6 * 1000 = 100600, rounded = 100600
    expect(events[0].ts).toBe(100600);
    // (100.6 + 50.7) * 1000 = 151300, rounded = 151300
    expect(events[1].ts).toBe(151300);
  });

  it('should handle measure with very large timestamps', () => {
    const measure: PerformanceMeasure = {
      name: 'large-timestamp-measure',
      entryType: 'measure',
      startTime: 999999999.999,
      duration: 123456789.123,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'large-id' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    // 999999999.999 * 1000 = 999999999999, rounded = 999999999999
    expect(events[0].ts).toBe(999999999999);
    // (999999999.999 + 123456789.123) * 1000 = 1123456789122, rounded = 1123456789122
    expect(events[1].ts).toBe(1123456789122);
  });

  it('should handle measure with negative duration', () => {
    const measure: PerformanceMeasure = {
      name: 'negative-duration-measure',
      entryType: 'measure',
      startTime: 100,
      duration: -10,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'negative-id' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events[0].ts).toBe(100000);
    // 100 + (-10) = 90, so 90 * 1000 = 90000
    expect(events[1].ts).toBe(90000);
  });

  it('should handle measure with numeric detail values', () => {
    const measure: PerformanceMeasure = {
      name: 'numeric-detail-measure',
      entryType: 'measure',
      startTime: 150,
      duration: 25,
      detail: { count: 42, value: 3.14 } as unknown as Record<string, unknown>,
    };

    const ctx = {
      pid: 7,
      tid: 8,
      nextId2: () => ({ local: 'numeric-id' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events[0].args).toEqual({
      detail: '{"count":42,"value":3.14}',
    });
    expect(events[1].args).toEqual({});
  });
});

describe('markToTraceEvent', () => {
  it('should convert performance mark to trace event', () => {
    const mark: PerformanceMark = {
      name: 'test-mark',
      entryType: 'mark',
      startTime: 300,
      duration: 0,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 42 }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event).toEqual({
      cat: 'blink.user_timing',
      name: 'test-mark',
      ph: 'b',
      pid: 1,
      tid: 2,
      ts: 300000, // 300 * 1000
      id2: { local: 42 },
      args: {},
    });
  });

  it('should handle mark with detail', () => {
    const mark: PerformanceMark = {
      name: 'test-mark',
      entryType: 'mark',
      startTime: 150,
      duration: 0,
      detail: { type: 'start' },
    };

    const ctx = {
      pid: 5,
      tid: 6,
      nextId2: () => ({ local: 7 }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event).toEqual({
      cat: 'blink.user_timing',
      name: 'test-mark',
      ph: 'b',
      pid: 5,
      tid: 6,
      ts: 150000, // 150 * 1000
      id2: { local: 7 },
      args: {
        detail: '{"type":"start"}',
      },
    });
  });

  it('should call nextId2 for each mark', () => {
    const mark1: PerformanceMark = {
      name: 'mark1',
      entryType: 'mark',
      startTime: 100,
      duration: 0,
    };

    const mark2: PerformanceMark = {
      name: 'mark2',
      entryType: 'mark',
      startTime: 200,
      duration: 0,
    };

    let callCount = 0;
    const ctx = {
      pid: 9,
      tid: 10,
      nextId2: () => {
        callCount++;
        return { local: `id-${callCount}` };
      },
    };

    const event1 = markToTraceEvent(mark1, ctx);
    const event2 = markToTraceEvent(mark2, ctx);

    expect(callCount).toBe(2);
    expect(event1.id2).toEqual({ local: 'id-1' });
    expect(event2.id2).toEqual({ local: 'id-2' });
  });

  it('should handle mark with complex detail object', () => {
    const mark: PerformanceMark = {
      name: 'complex-mark',
      entryType: 'mark',
      startTime: 250,
      duration: 0,
      detail: {
        nested: { value: 123 },
        array: [1, 2, 3],
        string: 'test',
      },
    };

    const ctx = {
      pid: 11,
      tid: 12,
      nextId2: () => ({ local: '0xABC' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event.args).toEqual({
      detail: '{"nested":{"value":123},"array":[1,2,3],"string":"test"}',
    });
  });

  it('should handle mark with null detail', () => {
    const mark: PerformanceMark = {
      name: 'null-detail-mark',
      entryType: 'mark',
      startTime: 100,
      duration: 0,
      detail: null as unknown as Record<string, unknown>,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'null-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event.args).toEqual({
      detail: 'null',
    });
  });

  it('should handle mark with empty object detail', () => {
    const mark: PerformanceMark = {
      name: 'empty-detail-mark',
      entryType: 'mark',
      startTime: 200,
      duration: 0,
      detail: {},
    };

    const ctx = {
      pid: 3,
      tid: 4,
      nextId2: () => ({ local: 'empty-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event.args).toEqual({
      detail: '{}',
    });
  });

  it('should handle mark with array detail', () => {
    const mark: PerformanceMark = {
      name: 'array-detail-mark',
      entryType: 'mark',
      startTime: 300,
      duration: 0,
      detail: [1, 2, 3, 'test'] as unknown as Record<string, unknown>,
    };

    const ctx = {
      pid: 5,
      tid: 6,
      nextId2: () => ({ local: 'array-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event.args).toEqual({
      detail: '[1,2,3,"test"]',
    });
  });

  it('should handle mark with decimal timestamps and round correctly', () => {
    const mark: PerformanceMark = {
      name: 'decimal-mark',
      entryType: 'mark',
      startTime: 100.4,
      duration: 0,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'decimal-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    // 100.4 * 1000 = 100400, rounded = 100400
    expect(event.ts).toBe(100400);
  });

  it('should handle mark with decimal timestamps rounding up', () => {
    const mark: PerformanceMark = {
      name: 'decimal-round-up-mark',
      entryType: 'mark',
      startTime: 100.6,
      duration: 0,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'round-up-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    // 100.6 * 1000 = 100600, rounded = 100600
    expect(event.ts).toBe(100600);
  });

  it('should handle mark with very large timestamps', () => {
    const mark: PerformanceMark = {
      name: 'large-timestamp-mark',
      entryType: 'mark',
      startTime: 999999999.999,
      duration: 0,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'large-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    // 999999999.999 * 1000 = 999999999999, rounded = 999999999999
    expect(event.ts).toBe(999999999999);
  });

  it('should handle mark with empty string name', () => {
    const mark: PerformanceMark = {
      name: '',
      entryType: 'mark',
      startTime: 100,
      duration: 0,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'empty-name-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event.name).toBe('');
    expect(event.cat).toBe('blink.user_timing');
    expect(event.ph).toBe('b');
  });

  it('should handle mark with special characters in name', () => {
    const mark: PerformanceMark = {
      name: 'test-mark-!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
      entryType: 'mark',
      startTime: 100,
      duration: 0,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'special-char-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event.name).toBe('test-mark-!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`');
    expect(event.cat).toBe('blink.user_timing');
    expect(event.ph).toBe('b');
  });

  it('should handle mark with numeric detail values', () => {
    const mark: PerformanceMark = {
      name: 'numeric-detail-mark',
      entryType: 'mark',
      startTime: 150,
      duration: 0,
      detail: { count: 42, value: 3.14 } as unknown as Record<string, unknown>,
    };

    const ctx = {
      pid: 7,
      tid: 8,
      nextId2: () => ({ local: 'numeric-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event.args).toEqual({
      detail: '{"count":42,"value":3.14}',
    });
  });

  it('should handle mark with unicode characters in name', () => {
    const mark: PerformanceMark = {
      name: 'test-mark-🚀-中文-日本語',
      entryType: 'mark',
      startTime: 100,
      duration: 0,
    };

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: 'unicode-id' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event.name).toBe('test-mark-🚀-中文-日本語');
    expect(event.cat).toBe('blink.user_timing');
    expect(event.ph).toBe('b');
  });
});
