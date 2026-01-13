import type { PerformanceMark, PerformanceMeasure } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';
import {
  entryToTraceTimestamp,
  frameName,
  frameTreeNodeId,
  getCompleteEvent,
  getInstantEvent,
  getSpan,
  getSpanEvent,
  getStartTracing,
  getTraceFile,
  markToInstantEvent,
  measureToSpanEvents,
} from './trace-file-utils.js';

describe('getTraceFile', () => {
  it('should create trace file with empty events array', () => {
    const result = getTraceFile({ traceEvents: [] });

    expect(result).toStrictEqual({
      traceEvents: [],
      displayTimeUnit: 'ms',
      metadata: {
        source: 'Node.js UserTiming',
        startTime: expect.any(String),
        hardwareConcurrency: expect.any(Number),
      },
    });
    expect(() => new Date(result?.metadata!.startTime)).not.toThrow();
  });

  it('should create trace file with events', () => {
    expect(
      getTraceFile({
        traceEvents: [
          getInstantEvent({
            name: 'test-event',
            ts: 1_234_567_890,
            pid: 123,
            tid: 456,
          }),
        ],
      }),
    ).toStrictEqual({
      traceEvents: [
        expect.objectContaining({
          name: 'test-event',
          ts: 1_234_567_890,
          pid: 123,
          tid: 456,
        }),
      ],
      displayTimeUnit: 'ms',
      metadata: {
        source: 'Node.js UserTiming',
        startTime: expect.any(String),
        hardwareConcurrency: expect.any(Number),
      },
    });
  });

  it('should use custom startTime when provided', () => {
    const result = getTraceFile({
      traceEvents: [],
      startTime: '2023-01-01T00:00:00.000Z',
    });

    expect(result).toHaveProperty(
      'metadata',
      expect.objectContaining({
        startTime: '2023-01-01T00:00:00.000Z',
      }),
    );
  });

  it('should include hardware concurrency', () => {
    expect(getTraceFile({ traceEvents: [] })).toHaveProperty(
      'metadata',
      expect.objectContaining({
        hardwareConcurrency: expect.any(Number),
      }),
    );
  });
});

describe('frameTreeNodeId', () => {
  it.each([
    [123, 456, 1_230_456],
    [1, 2, 102],
    [999, 999, 9_990_999],
  ])('should generate correct frame tree node ID', (pid, tid, expected) => {
    expect(frameTreeNodeId(pid, tid)).toBe(expected);
  });
});

describe('frameName', () => {
  it.each([
    [123, 456],
    [1, 2],
    [999, 999],
  ])('should generate correct frame name', (pid, tid) => {
    expect(frameName(pid, tid)).toBe(`FRAME0P${pid}T${tid}`);
  });
});

describe('getStartTracing', () => {
  it('should create start tracing event with required url', () => {
    expect(getStartTracing({ url: 'https://example.com' })).toStrictEqual({
      cat: 'devtools.timeline',
      ph: 'i',
      name: 'TracingStartedInBrowser',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      args: {
        data: {
          frameTreeNodeId: expect.any(Number),
          frames: [
            {
              frame: expect.stringMatching(/^FRAME0P\d+T\d+$/),
              isInPrimaryMainFrame: true,
              isOutermostMainFrame: true,
              name: '',
              processId: expect.any(Number),
              url: 'https://example.com',
            },
          ],
          persistentIds: true,
        },
      },
    });
  });

  it('should use custom pid and tid', () => {
    expect(
      getStartTracing({
        url: 'https://test.com',
        pid: 777,
        tid: 888,
      }),
    ).toStrictEqual({
      cat: 'devtools.timeline',
      ph: 'i',
      name: 'TracingStartedInBrowser',
      pid: 777,
      tid: 888,
      ts: expect.any(Number),
      args: {
        data: {
          frameTreeNodeId: 7_770_888,
          frames: [
            {
              frame: 'FRAME0P777T888',
              isInPrimaryMainFrame: true,
              isOutermostMainFrame: true,
              name: '',
              processId: 777,
              url: 'https://test.com',
            },
          ],
          persistentIds: true,
        },
      },
    });
  });
});

describe('getCompleteEvent', () => {
  it('should create complete event with required fields', () => {
    expect(
      getCompleteEvent({
        name: 'test-complete',
        dur: 1000,
      }),
    ).toStrictEqual({
      cat: 'devtools.timeline',
      ph: 'X',
      name: 'test-complete',
      dur: 1000,
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      args: {},
    });
  });

  it('should use custom pid, tid, and ts', () => {
    expect(
      getCompleteEvent({
        name: 'custom-complete',
        dur: 500,
        pid: 111,
        tid: 222,
        ts: 1_234_567_890,
      }),
    ).toStrictEqual({
      cat: 'devtools.timeline',
      ph: 'X',
      name: 'custom-complete',
      dur: 500,
      pid: 111,
      tid: 222,
      ts: 1_234_567_890,
      args: {},
    });
  });
});

describe('markToInstantEvent', () => {
  it('should convert performance mark to instant event with detail', () => {
    expect(
      markToInstantEvent({
        name: 'test-mark',
        startTime: 1000,
        detail: { customData: 'test' },
      } as PerformanceMark),
    ).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-mark',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      args: { detail: { customData: 'test' } },
    });
  });

  it('should convert performance mark to instant event without detail', () => {
    expect(
      markToInstantEvent({
        name: 'test-mark',
        startTime: 1000,
        detail: null,
      } as PerformanceMark),
    ).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-mark',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      args: {},
    });
  });

  it('should use custom options when provided', () => {
    expect(
      markToInstantEvent(
        {
          name: 'test-mark',
          startTime: 1000,
          detail: { customData: 'test' },
        } as PerformanceMark,
        {
          name: 'custom-name',
          pid: 999,
          tid: 888,
        },
      ),
    ).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'custom-name',
      pid: 999,
      tid: 888,
      ts: expect.any(Number),
      args: { detail: { customData: 'test' } },
    });
  });
});

describe('measureToSpanEvents', () => {
  it('should convert performance measure to span events with detail', () => {
    expect(
      measureToSpanEvents({
        name: 'test-measure',
        startTime: 1000,
        duration: 500,
        detail: { measurement: 'data' },
      } as PerformanceMeasure),
    ).toStrictEqual([
      {
        cat: 'blink.user_timing',
        ph: 'b',
        name: 'test-measure',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: expect.any(Number),
        id2: { local: expect.stringMatching(/^0x\d+$/) },
        args: { data: { detail: { measurement: 'data' } } },
      },
      {
        cat: 'blink.user_timing',
        ph: 'e',
        name: 'test-measure',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: expect.any(Number),
        id2: { local: expect.stringMatching(/^0x\d+$/) },
        args: { data: { detail: { measurement: 'data' } } },
      },
    ]);
  });

  it('should convert performance measure to span events without detail', () => {
    expect(
      measureToSpanEvents({
        name: 'test-measure',
        startTime: 1000,
        duration: 500,
        detail: undefined,
      } as PerformanceMeasure),
    ).toStrictEqual([
      {
        cat: 'blink.user_timing',
        ph: 'b',
        name: 'test-measure',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: expect.any(Number),
        id2: { local: expect.stringMatching(/^0x\d+$/) },
        args: {},
      },
      {
        cat: 'blink.user_timing',
        ph: 'e',
        name: 'test-measure',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: expect.any(Number),
        id2: { local: expect.stringMatching(/^0x\d+$/) },
        args: {},
      },
    ]);
  });

  it('should use custom options when provided', () => {
    const result = measureToSpanEvents(
      {
        name: 'test-measure',
        startTime: 1000,
        duration: 500,
        detail: { measurement: 'data' },
      } as PerformanceMeasure,
      {
        name: 'custom-measure',
        pid: 777,
        tid: 666,
      },
    );

    expect(result).toStrictEqual([
      expect.objectContaining({
        name: 'custom-measure',
        pid: 777,
        tid: 666,
        args: { data: { detail: { measurement: 'data' } } },
      }),
      expect.objectContaining({
        name: 'custom-measure',
        pid: 777,
        tid: 666,
        args: { data: { detail: { measurement: 'data' } } },
      }),
      expect.objectContaining({
        name: 'custom-measure',
        pid: 777,
        tid: 666,
        args: { data: { detail: { measurement: 'data' } } },
      }),
    ]);
  });
});

describe('entryToTraceTimestamp', () => {
  it('should convert entry timestamp for start time', () => {
    expect(
      typeof entryToTraceTimestamp({
        startTime: 1000,
        duration: 500,
        entryType: 'measure',
      } as PerformanceMeasure),
    ).toBe('number');
  });

  it('should convert entry timestamp for end time', () => {
    const mockEntry = {
      startTime: 1000,
      duration: 500,
      entryType: 'measure',
    } as PerformanceMeasure;

    expect(entryToTraceTimestamp(mockEntry, true)).toBeGreaterThan(
      entryToTraceTimestamp(mockEntry, false),
    );
  });

  it('should handle non-measure entries', () => {
    expect(
      typeof entryToTraceTimestamp(
        {
          startTime: 1000,
          entryType: 'mark',
        } as PerformanceMark,
        true,
      ),
    ).toBe('number');
  });
});

describe('getSpanEvent', () => {
  it('should create begin event with args detail', () => {
    expect(
      getSpanEvent('b', {
        name: 'test-span',
        id2: { local: '0x1' },
        args: { data: { detail: { customData: 'test' } as any } },
      }),
    ).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'b',
      name: 'test-span',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      id2: { local: '0x1' },
      args: { data: { detail: { customData: 'test' } } },
    });
  });

  it('should create end event without args detail', () => {
    expect(
      getSpanEvent('e', {
        name: 'test-span',
        id2: { local: '0x2' },
      }),
    ).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'e',
      name: 'test-span',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      id2: { local: '0x2' },
      args: {},
    });
  });
});

describe('getSpan', () => {
  it('should create span events with custom tsMarkerPadding', () => {
    const result = getSpan({
      name: 'test-span',
      tsB: 1000,
      tsE: 1500,
      tsMarkerPadding: 5,
      args: {},
    });

    expect(result).toStrictEqual([
      {
        cat: 'blink.user_timing',
        ph: 'b',
        name: 'test-span',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: 1005,
        id2: { local: expect.stringMatching(/^0x\d+$/) },
        args: {},
      },
      {
        cat: 'blink.user_timing',
        ph: 'e',
        name: 'test-span',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: 1495,
        id2: { local: expect.stringMatching(/^0x\d+$/) },
        args: {},
      },
    ]);
  });

  it('should generate id2 when not provided', () => {
    const result = getSpan({
      name: 'test-span',
      tsB: 1000,
      tsE: 1500,
    });

    expect(result).toHaveLength(2);
    expect(result[0].id2?.local).toMatch(/^0x\d+$/);
    expect(result[1].id2).toEqual(result[0].id2);
  });

  it('should use provided id2', () => {
    expect(
      getSpan({
        name: 'test-span',
        tsB: 1000,
        tsE: 1500,
        id2: { local: 'custom-id' },
      }),
    ).toStrictEqual([
      {
        cat: 'blink.user_timing',
        ph: 'b',
        name: 'test-span',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: 1001,
        id2: { local: 'custom-id' },
        args: {},
      },
      {
        cat: 'blink.user_timing',
        ph: 'e',
        name: 'test-span',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: 1499,
        id2: { local: 'custom-id' },
        args: {},
      },
    ]);
  });
});
