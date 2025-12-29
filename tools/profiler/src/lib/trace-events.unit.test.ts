import { performance } from 'node:perf_hooks';
import { describe, expect, it, vi } from 'vitest';
import {
  getFrameName,
  getFrameTreeNodeId,
  getRunTaskTraceEvent,
  getStartTracing,
} from './trace-events-helper.js';
import { markToTraceEvent, measureToTraceEvents } from './trace-file-output.js';

// Mock performance.timeOrigin for consistent timestamps in tests
vi.mock('node:perf_hooks', async () => {
  const actual = await vi.importActual('node:perf_hooks');
  return {
    ...actual,
    performance: {
      ...actual.performance,
      timeOrigin: 1766930000000, // Set to match timeOriginBase for effectiveTimeOrigin = 0
    },
  };
});

describe('getFrameTreeNodeId', () => {
  it.each([
    [1, 2, 102],
    [0, 0, 0],
  ])(
    'should return correct frame tree node id for pid and tid',
    (pid, tid, result) => {
      expect(getFrameTreeNodeId(pid, tid)).toBe(result);
    },
  );
});

describe('getFrameName', () => {
  it('should return correct frame name for pid and tid', () => {
    expect(getFrameName(1, 2)).toBe('FRAME0P1T2');
  });
});

describe('getStartTracing', () => {
  it('should create correct tracing start event', () => {
    const result = getStartTracing(1, 2, {
      traceStartTs: 123456,
      url: 'http://example.com',
    });

    expect(result).toStrictEqual({
      cat: 'devtools.timeline',
      name: 'TracingStartedInBrowser',
      ph: 'i',
      pid: 1,
      tid: 2,
      ts: 123456,
      tts: 123456,
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

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: '0x1' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      cat: 'blink.user_timing',
      name: 'test-measure',
      ph: 'b',
      pid: 1,
      tid: 2,
      ts: 100000,
      id2: { local: '0x1' },
      args: {},
    });

    expect(events[1]).toEqual({
      cat: 'blink.user_timing',
      name: 'test-measure',
      ph: 'e',
      pid: 1,
      tid: 2,
      ts: 150000,
      id2: { local: '0x1' },
      args: {},
    });
  });

  it('should handle measure with detail property', () => {
    const measure = {
      name: 'test-measure-detail',
      entryType: 'measure',
      startTime: 200,
      duration: 75,
      detail: { custom: 'data', value: 42 },
    } as PerformanceMeasure;

    const ctx = {
      pid: 3,
      tid: 4,
      nextId2: () => ({ local: '0x1' }),
    };

    const events = measureToTraceEvents(measure, ctx);

    expect(events).toHaveLength(2);
    expect(events[0]).toEqual({
      cat: 'blink.user_timing',
      name: 'test-measure-detail',
      ph: 'b',
      pid: 3,
      tid: 4,
      ts: 200000,
      id2: { local: '0x1' },
      args: { detail: JSON.stringify({ custom: 'data', value: 42 }) },
    });

    expect(events[1]).toEqual({
      cat: 'blink.user_timing',
      name: 'test-measure-detail',
      ph: 'e',
      pid: 3,
      tid: 4,
      ts: 275000,
      id2: { local: '0x1' },
      args: {},
    });
  });
});

describe('markToTraceEvent', () => {
  it('should convert performance mark to trace event', () => {
    const mark = {
      name: 'test-mark',
      entryType: 'mark',
      startTime: 300,
      duration: 0,
    } as PerformanceMark;

    const ctx = {
      pid: 1,
      tid: 2,
      nextId2: () => ({ local: '42' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event).toEqual({
      cat: 'blink.user_timing',
      name: 'test-mark',
      ph: 'I',
      s: 't',
      pid: 1,
      tid: 2,
      ts: 300000,
      tts: 300000,
      args: { data: { startTime: 300 } },
    });
  });

  it('should handle mark with detail property', () => {
    const mark = {
      name: 'test-mark-detail',
      entryType: 'mark',
      startTime: 400,
      duration: 0,
      detail: { metadata: 'info', timestamp: 123456789 },
    } as PerformanceMark;

    const ctx = {
      pid: 5,
      tid: 6,
      nextId2: () => ({ local: '0x1' }),
    };

    const event = markToTraceEvent(mark, ctx);

    expect(event).toEqual({
      cat: 'blink.user_timing',
      name: 'test-mark-detail',
      ph: 'I',
      s: 't',
      pid: 5,
      tid: 6,
      ts: 400000,
      tts: 400000,
      args: {
        data: {
          detail: JSON.stringify({ metadata: 'info', timestamp: 123456789 }),
          startTime: 400,
        },
      },
    });
  });
});
