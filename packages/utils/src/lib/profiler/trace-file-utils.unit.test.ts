import type { PerformanceMark, PerformanceMeasure } from 'node:perf_hooks';
import {
  complete,
  createTraceFile,
  decodeEvent,
  deserializeTraceEvent,
  encodeEvent,
  entryToTraceEvents,
  getInstantEventTracingStartedInBrowser,
  getTraceMetadata,
  instant,
  markToInstantEvent,
  measureToSpanEvents,
  nextId2,
  serializeTraceEvent,
  span,
} from './trace-file-utils.js';

describe('getTraceFile', () => {
  it('should create trace file with empty events array', () => {
    expect(createTraceFile({ traceEvents: [] })).toStrictEqual({
      traceEvents: [],
      displayTimeUnit: 'ms',
      metadata: {
        source: 'DevTools',
        dataOrigin: 'TraceEvents',
        startTime: expect.any(String),
        hardwareConcurrency: expect.any(Number),
      },
    });
  });

  it('should create trace file with events', () => {
    expect(
      createTraceFile({
        traceEvents: [
          instant('test-event', 1_234_567_890, {
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
        source: 'DevTools',
        dataOrigin: 'TraceEvents',
        startTime: expect.any(String),
        hardwareConcurrency: expect.any(Number),
      },
    });
  });

  it('should use custom startTime when provided', () => {
    const result = createTraceFile({
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
    expect(createTraceFile({ traceEvents: [] })).toHaveProperty(
      'metadata',
      expect.objectContaining({
        hardwareConcurrency: expect.any(Number),
      }),
    );
  });
});

describe('getInstantEventTracingStartedInBrowser', () => {
  it('should create start tracing event with required url', () => {
    expect(
      getInstantEventTracingStartedInBrowser({ url: 'https://example.com' }),
    ).toStrictEqual({
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
      getInstantEventTracingStartedInBrowser({
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

describe('complete', () => {
  it('should create complete event with required fields', () => {
    expect(complete('test-complete', 1000)).toStrictEqual({
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
      complete('custom-complete', 500, {
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
      ph: 'I',
      name: 'test-mark',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      args: { data: { detail: { customData: 'test' } } },
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
      ph: 'I',
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
      ph: 'I',
      name: 'custom-name',
      pid: 999,
      tid: 888,
      ts: expect.any(Number),
      args: { data: { detail: { customData: 'test' } } },
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
        args: { detail: { measurement: 'data' } },
      },
      {
        cat: 'blink.user_timing',
        ph: 'e',
        name: 'test-measure',
        pid: expect.any(Number),
        tid: expect.any(Number),
        ts: expect.any(Number),
        id2: { local: expect.stringMatching(/^0x\d+$/) },
        args: { detail: { measurement: 'data' } },
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
        args: { detail: { measurement: 'data' } },
      }),
      expect.objectContaining({
        name: 'custom-measure',
        pid: 777,
        tid: 666,
        args: { detail: { measurement: 'data' } },
      }),
    ]);
  });
});

describe('span', () => {
  it('should create span events with custom tsMarkerPadding', () => {
    const result = span('test-span', 1000, 1500, {
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
    const result = span('test-span', 1000, 1500);

    expect(result).toHaveLength(2);
    expect(result.at(0)?.id2?.local).toMatch(/^0x\d+$/);
    expect(result.at(1)?.id2).toEqual(result.at(0)?.id2);
  });

  it('should use provided id2', () => {
    expect(
      span('test-span', 1000, 1500, {
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

describe('nextId2', () => {
  it('should generate unique IDs with local property', () => {
    const id1 = nextId2();
    const id2 = nextId2();

    expect(id1).toHaveProperty('local');
    expect(id2).toHaveProperty('local');
    expect(id1.local).toMatch(/^0x\d+$/);
    expect(id2.local).toMatch(/^0x\d+$/);
    expect(id1.local).not.toBe(id2.local);
  });

  it('should increment the counter for each call', () => {
    // Reset counter by calling it multiple times
    nextId2();
    nextId2();
    const id = nextId2();

    expect(id.local).toMatch(/^0x\d+$/);
  });
});

describe('entryToTraceEvents', () => {
  it('should convert performance mark to instant event', () => {
    const mark: PerformanceMark = {
      name: 'test-mark',
      entryType: 'mark',
      startTime: 1000,
      duration: 0,
      detail: { customData: 'test' },
      toJSON(): any {},
    };

    const result = entryToTraceEvents(mark);

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'I',
      name: 'test-mark',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      args: { data: { detail: { customData: 'test' } } },
    });
  });

  it('should convert performance measure to span events', () => {
    const measure: PerformanceMeasure = {
      name: 'test-measure',
      entryType: 'measure',
      startTime: 1000,
      duration: 500,
      detail: { measurement: 'data' },
      toJSON(): any {},
    };

    const result = entryToTraceEvents(measure);

    expect(result).toHaveLength(2);
    expect(result[0]).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'b',
      name: 'test-measure',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      id2: { local: expect.stringMatching(/^0x\d+$/) },
      args: { detail: { measurement: 'data' } },
    });
    expect(result[1]).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'e',
      name: 'test-measure',
      pid: expect.any(Number),
      tid: expect.any(Number),
      ts: expect.any(Number),
      id2: { local: expect.stringMatching(/^0x\d+$/) },
      args: { detail: { measurement: 'data' } },
    });
  });

  it('should return empty array for unknown entry types', () => {
    const unknownEntry = {
      name: 'unknown',
      entryType: 'unknown' as any,
      startTime: 1000,
      duration: 0,
    };

    const result = entryToTraceEvents(unknownEntry as any);

    expect(result).toHaveLength(0);
  });
});

describe('getTraceMetadata', () => {
  it('should create metadata with default values', () => {
    const metadata = getTraceMetadata();

    expect(metadata).toStrictEqual({
      source: 'DevTools',
      startTime: expect.any(String),
      hardwareConcurrency: 1,
      dataOrigin: 'TraceEvents',
    });
  });

  it('should use provided startDate', () => {
    const startDate = new Date('2023-01-01T00:00:00.000Z');
    const metadata = getTraceMetadata(startDate);

    expect(metadata.startTime).toBe('2023-01-01T00:00:00.000Z');
  });

  it('should merge custom metadata', () => {
    const customMetadata = { version: '1.0.0', platform: 'node' };
    const metadata = getTraceMetadata(undefined, customMetadata);

    expect(metadata).toStrictEqual({
      source: 'DevTools',
      startTime: expect.any(String),
      hardwareConcurrency: 1,
      dataOrigin: 'TraceEvents',
      version: '1.0.0',
      platform: 'node',
    });
  });
});

describe('decodeEvent', () => {
  it('should decode trace event with string details', () => {
    const encodedEvent = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: '{"custom": "data"}',
        data: { detail: '{"nested": "value"}' },
      },
    };

    const result = decodeEvent(encodedEvent);

    expect(result).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: { custom: 'data' },
        data: { detail: { nested: 'value' } },
      },
    });
  });

  it('should handle trace event without args', () => {
    const encodedEvent = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
    };

    const result = decodeEvent(encodedEvent);

    expect(result).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
    });
  });

  it('should handle args without data property', () => {
    const encodedEvent = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: '{"custom": "data"}',
      },
    };

    const result = decodeEvent(encodedEvent);

    expect(result).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: { custom: 'data' },
      },
    });
  });
});

describe('encodeEvent', () => {
  it('should encode trace event with object details', () => {
    const event = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: { custom: 'data' },
        data: { detail: { nested: 'value' } },
      },
    };

    const result = encodeEvent(event);

    expect(result).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: '{"custom":"data"}',
        data: { detail: '{"nested":"value"}' },
      },
    });
  });

  it('should handle trace event without args', () => {
    const event = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
    };

    const result = encodeEvent(event);

    expect(result).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
    });
  });

  it('should handle args without data property', () => {
    const event = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: { custom: 'data' },
      },
    };

    const result = encodeEvent(event);

    expect(result).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: '{"custom":"data"}',
      },
    });
  });
});

describe('serializeTraceEvent', () => {
  it('should serialize trace event to JSON string', () => {
    const event = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: { custom: 'data' },
      },
    };

    const result = serializeTraceEvent(event);

    expect(result).toBeString();
    const parsed = JSON.parse(result);
    expect(parsed).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: '{"custom":"data"}',
      },
    });
  });

  it('should handle trace event without args', () => {
    const event = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
    };

    const result = serializeTraceEvent(event);

    expect(typeof result).toBe('string');
    const parsed = JSON.parse(result);
    expect(parsed).toStrictEqual({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
    });
  });

  it('should handle nested object details in args', () => {
    const event = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: { custom: 'data' },
        data: { detail: { nested: 'value' } },
      },
    };

    const result = serializeTraceEvent(event);

    expect(typeof result).toBe('string');
    const parsed = JSON.parse(result);
    expect(parsed.args).toStrictEqual({
      detail: '{"custom":"data"}',
      data: { detail: '{"nested":"value"}' },
    });
  });
});

describe('deserializeTraceEvent', () => {
  it('should deserialize JSON string back to trace event', () => {
    const originalEvent = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: { custom: 'data' },
      },
    };

    const serialized = serializeTraceEvent(originalEvent);
    const deserialized = deserializeTraceEvent(serialized);

    expect(deserialized).toStrictEqual(originalEvent);
  });

  it('should handle round-trip serialization', () => {
    const originalEvent = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'round-trip-test',
      pid: 789,
      tid: 101,
      ts: 987_654_321,
      args: {
        detail: { custom: 'data', nested: { value: 42 } },
        data: { detail: { nested: 'value' } },
      },
    };

    const serialized = serializeTraceEvent(originalEvent);
    const deserialized = deserializeTraceEvent(serialized);
    const reSerialized = serializeTraceEvent(deserialized);
    const reDeserialized = deserializeTraceEvent(reSerialized);

    expect(reDeserialized).toStrictEqual(originalEvent);
  });

  it('should handle trace event without args', () => {
    const originalEvent = {
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
    };

    const serialized = serializeTraceEvent(originalEvent);
    const deserialized = deserializeTraceEvent(serialized);

    expect(deserialized).toStrictEqual(originalEvent);
  });

  it('should decode string-encoded details back to objects', () => {
    const jsonString = JSON.stringify({
      cat: 'blink.user_timing',
      ph: 'i',
      name: 'test-event',
      pid: 123,
      tid: 456,
      ts: 1000,
      args: {
        detail: '{"custom":"data"}',
        data: { detail: '{"nested":"value"}' },
      },
    });

    const deserialized = deserializeTraceEvent(jsonString);

    expect(deserialized.args).toStrictEqual({
      detail: { custom: 'data' },
      data: { detail: { nested: 'value' } },
    });
  });
});
