import type { TraceEvent } from './trace-file.type.js';
import {
  generateTraceContent,
  traceEventCodec,
  traceEventWalFormat,
} from './wal-json-trace.js';

describe('traceEventCodec', () => {
  // Memory representation: TraceEvent objects with nested objects in args.detail and args.data.detail
  // This is the format we process and hold in memory
  const instantEvent: TraceEvent = {
    name: 'cp:test-event',
    ph: 'i',
    ts: 123_456_789,
    pid: 123,
    tid: 456,
    cat: 'blink.user_timing',
    args: {
      detail: {
        custom: 'data',
      },
      data: {
        detail: {
          nested: 'value',
        },
      },
      devtools: {
        dataType: 'track-entry',
        track: 'test-track',
        color: 'primary',
        tooltipText: 'Test event tooltip',
      },
    },
  } satisfies TraceEvent;

  const spanBeginEvent: TraceEvent = {
    name: 'cp:test-span',
    ph: 'b',
    ts: 200_000_000,
    pid: 123,
    tid: 456,
    cat: 'blink.user_timing',
    id2: { local: '0x1' },
    args: {
      devtools: {
        dataType: 'track-entry',
        track: 'span-track',
        color: 'secondary',
        tooltipText: 'Test span begin',
      },
    },
  } satisfies TraceEvent;

  const spanEndEvent: TraceEvent = {
    name: 'cp:test-span',
    ph: 'e',
    ts: 250_000_000,
    pid: 123,
    tid: 456,
    cat: 'blink.user_timing',
    id2: { local: '0x1' },
    args: {
      devtools: {
        dataType: 'track-entry',
        track: 'span-track',
        color: 'secondary',
        tooltipText: 'Test span end',
      },
    },
  } satisfies TraceEvent;

  // Encoded JSON string representation: nested objects in args.detail and args.data.detail are JSON strings
  // This is the format stored in WAL files (.jsonl)
  const instantEventJsonString = JSON.stringify({
    name: 'cp:test-event',
    ph: 'i',
    ts: 123_456_789,
    pid: 123,
    tid: 456,
    cat: 'blink.user_timing',
    args: {
      detail: JSON.stringify({ custom: 'data' }),
      data: {
        detail: JSON.stringify({ nested: 'value' }),
      },
      devtools: {
        dataType: 'track-entry',
        track: 'test-track',
        color: 'primary',
        tooltipText: 'Test event tooltip',
      },
    },
  });

  const spanBeginEventJsonString = JSON.stringify({
    name: 'cp:test-span',
    ph: 'b',
    ts: 200_000_000,
    pid: 123,
    tid: 456,
    cat: 'blink.user_timing',
    id2: { local: '0x1' },
    args: {
      devtools: {
        dataType: 'track-entry',
        track: 'span-track',
        color: 'secondary',
        tooltipText: 'Test span begin',
      },
    },
  });

  const spanEndEventJsonString = JSON.stringify({
    name: 'cp:test-span',
    ph: 'e',
    ts: 250_000_000,
    pid: 123,
    tid: 456,
    cat: 'blink.user_timing',
    id2: { local: '0x1' },
    args: {
      devtools: {
        dataType: 'track-entry',
        track: 'span-track',
        color: 'secondary',
        tooltipText: 'Test span end',
      },
    },
  });

  describe('decode direction (JSON string → memory object)', () => {
    it('should decode instant event from JSON string', () => {
      const decoded = traceEventCodec.decode(instantEventJsonString);
      expect(decoded).toStrictEqual(instantEvent);
    });

    it('should decode span begin event from JSON string', () => {
      const decoded = traceEventCodec.decode(spanBeginEventJsonString);
      expect(decoded).toStrictEqual(spanBeginEvent);
    });

    it('should decode span end event from JSON string', () => {
      const decoded = traceEventCodec.decode(spanEndEventJsonString);
      expect(decoded).toStrictEqual(spanEndEvent);
    });

    it('should decode events with nested detail objects correctly', () => {
      const decoded = traceEventCodec.decode(instantEventJsonString);
      expect(decoded.args?.detail).toStrictEqual({ custom: 'data' });
      expect(decoded.args?.data?.detail).toStrictEqual({ nested: 'value' });
    });
  });

  describe('encode direction (memory object → JSON string)', () => {
    it('should encode instant event to JSON string', () => {
      const encoded = traceEventCodec.encode(instantEvent);
      expect(typeof encoded).toBe('string');
      const parsed = JSON.parse(encoded);
      expect(parsed.args.detail).toBe(JSON.stringify({ custom: 'data' }));
      expect(parsed.args.data.detail).toBe(JSON.stringify({ nested: 'value' }));
    });

    it('should encode span begin event to JSON string', () => {
      const encoded = traceEventCodec.encode(spanBeginEvent);
      expect(typeof encoded).toBe('string');
      const decoded = traceEventCodec.decode(encoded);
      expect(decoded).toStrictEqual(spanBeginEvent);
    });

    it('should encode span end event to JSON string', () => {
      const encoded = traceEventCodec.encode(spanEndEvent);
      expect(typeof encoded).toBe('string');
      const decoded = traceEventCodec.decode(encoded);
      expect(decoded).toStrictEqual(spanEndEvent);
    });

    it('should encode nested detail objects as JSON strings', () => {
      const encoded = traceEventCodec.encode(instantEvent);
      const parsed = JSON.parse(encoded);
      expect(typeof parsed.args.detail).toBe('string');
      expect(typeof parsed.args.data.detail).toBe('string');
      expect(JSON.parse(parsed.args.detail)).toStrictEqual({ custom: 'data' });
      expect(JSON.parse(parsed.args.data.detail)).toStrictEqual({
        nested: 'value',
      });
    });
  });

  describe('round-trip (memory → string → memory)', () => {
    it('should maintain consistency for instant event', () => {
      const encoded = traceEventCodec.encode(instantEvent);
      const decoded = traceEventCodec.decode(encoded);
      expect(decoded).toStrictEqual(instantEvent);
    });

    it('should maintain consistency for span begin event', () => {
      const encoded = traceEventCodec.encode(spanBeginEvent);
      const decoded = traceEventCodec.decode(encoded);
      expect(decoded).toStrictEqual(spanBeginEvent);
    });

    it('should maintain consistency for span end event', () => {
      const encoded = traceEventCodec.encode(spanEndEvent);
      const decoded = traceEventCodec.decode(encoded);
      expect(decoded).toStrictEqual(spanEndEvent);
    });

    it('should handle multiple round-trips correctly', () => {
      let current = instantEvent;
      for (let i = 0; i < 3; i++) {
        const encoded = traceEventCodec.encode(current);
        const decoded = traceEventCodec.decode(encoded);
        expect(decoded).toStrictEqual(instantEvent);
        current = decoded;
      }
    });
  });
});

describe('generateTraceContent', () => {
  it('should generate trace content for empty events array', () => {
    const events: TraceEvent[] = [];
    const metadata = { version: '1.0.0', generatedAt: '2024-01-01T00:00:00Z' };

    const result = generateTraceContent(events, metadata);

    const parsed = JSON.parse(result);
    expect(parsed).toStrictEqual({
      traceEvents: [
        expect.objectContaining({
          name: 'TracingStartedInBrowser',
          ph: 'i',
          cat: 'devtools.timeline',
          args: {
            data: expect.objectContaining({
              frames: expect.arrayContaining([
                expect.objectContaining({
                  url: 'empty-trace',
                }),
              ]),
            }),
          },
        }),
        expect.objectContaining({
          name: '[trace padding start]',
          ph: 'X',
          dur: 20_000,
          cat: 'devtools.timeline',
        }),
        expect.objectContaining({
          name: '[trace padding end]',
          ph: 'X',
          dur: 20_000,
          cat: 'devtools.timeline',
        }),
      ],
      displayTimeUnit: 'ms',
      metadata: {
        source: 'DevTools',
        startTime: expect.any(String),
        hardwareConcurrency: 1,
        dataOrigin: 'TraceEvents',
        version: '1.0.0',
        generatedAt: expect.any(String),
      },
    });
  });

  it('should generate trace content for non-empty events array', () => {
    const events: TraceEvent[] = [
      {
        name: 'cp:test-operation:start',
        ph: 'i',
        ts: 1000,
        pid: 123,
        tid: 456,
        cat: 'blink.user_timing',
        args: {
          dataType: 'track-entry',
          track: 'Test Track',
          trackGroup: 'Test Group',
        },
      },
      {
        name: 'cp:test-operation:end',
        ph: 'i',
        ts: 2000,
        pid: 123,
        tid: 456,
        cat: 'blink.user_timing',
        args: {
          dataType: 'track-entry',
          track: 'Test Track',
          trackGroup: 'Test Group',
        },
      },
    ];

    const result = generateTraceContent(events);

    const parsed = JSON.parse(result);
    expect(parsed).toStrictEqual({
      traceEvents: [
        expect.objectContaining({
          name: 'TracingStartedInBrowser',
          ph: 'i',
          cat: 'devtools.timeline',
          args: {
            data: expect.objectContaining({
              frames: expect.arrayContaining([
                expect.objectContaining({
                  url: 'generated-trace',
                }),
              ]),
            }),
          },
        }),
        expect.objectContaining({
          name: '[trace padding start]',
          ph: 'X',
          dur: 20_000,
          cat: 'devtools.timeline',
        }),
        ...events,
        expect.objectContaining({
          name: '[trace padding end]',
          ph: 'X',
          dur: 20_000,
          cat: 'devtools.timeline',
        }),
      ],
      displayTimeUnit: 'ms',
      metadata: {
        source: 'DevTools',
        startTime: expect.any(String),
        hardwareConcurrency: 1,
        dataOrigin: 'TraceEvents',
        generatedAt: expect.any(String),
      },
    });
  });

  it('should sort events by timestamp', () => {
    const events: TraceEvent[] = [
      {
        name: 'cp:second-operation',
        ph: 'i',
        ts: 2000,
        pid: 123,
        tid: 456,
        cat: 'blink.user_timing',
        args: { dataType: 'track-entry' },
      },
      {
        name: 'cp:first-operation',
        ph: 'i',
        ts: 1000,
        pid: 123,
        tid: 456,
        cat: 'blink.user_timing',
        args: { dataType: 'track-entry' },
      },
    ];

    const result = generateTraceContent(events);

    const parsed = JSON.parse(result);
    expect(parsed.traceEvents[2]).toStrictEqual(
      expect.objectContaining({ name: 'cp:first-operation', ts: 1000 }),
    );
    expect(parsed.traceEvents[3]).toStrictEqual(
      expect.objectContaining({ name: 'cp:second-operation', ts: 2000 }),
    );
  });

  it('should handle single event with proper margin calculation', () => {
    const events: TraceEvent[] = [
      {
        name: 'cp:single-event',
        ph: 'i',
        ts: 5000,
        pid: 123,
        tid: 456,
        cat: 'blink.user_timing',
        args: { dataType: 'track-entry' },
      },
    ];

    const result = generateTraceContent(events);

    const parsed = JSON.parse(result);
    const traceEvents = parsed.traceEvents;

    // First event should be tracing started
    expect(traceEvents[0]).toStrictEqual(
      expect.objectContaining({
        name: 'TracingStartedInBrowser',
        args: {
          data: expect.objectContaining({
            frames: expect.arrayContaining([
              expect.objectContaining({
                url: 'generated-trace',
              }),
            ]),
          }),
        },
      }),
    );

    // Second should be start margin at ts - 1,000,000μs (1000ms)
    expect(traceEvents[1]).toStrictEqual(
      expect.objectContaining({
        name: '[trace padding start]',
        ph: 'X',
        dur: 20_000,
      }),
    );

    // Third should be the actual event
    expect(traceEvents[2]).toStrictEqual(events[0]);

    // Fourth should be end margin at lastTs + 1,000,000μs (1000ms)
    expect(traceEvents[3]).toStrictEqual(
      expect.objectContaining({
        name: '[trace padding end]',
        ph: 'X',
        dur: 20_000,
      }),
    );
  });
});

describe('traceEventWalFormat', () => {
  it('should create WAL format with default directory', () => {
    const format = traceEventWalFormat();

    expect(format).toStrictEqual({
      baseName: 'trace',
      walExtension: '.jsonl',
      finalExtension: '.json',
      codec: {
        encode: expect.any(Function),
        decode: expect.any(Function),
      },
      finalizer: expect.any(Function),
    });
  });

  it('should create WAL format with consistent structure', () => {
    const format = traceEventWalFormat();

    expect(format.baseName).toBe('trace');
    expect(format.walExtension).toBe('.jsonl');
    expect(format.finalExtension).toBe('.json');
  });

  it('should encode and decode trace events correctly', () => {
    const format = traceEventWalFormat();
    const testEvent: TraceEvent = {
      name: 'cp:test-event',
      ph: 'i',
      ts: 123_456_789,
      pid: 123,
      tid: 456,
      cat: 'blink.user_timing',
      args: {
        dataType: 'track-entry',
        track: 'Test Track',
      },
    };

    const encoded = format.codec.encode(testEvent);
    expect(typeof encoded).toBe('string');

    const decoded = format.codec.decode(encoded);
    expect(decoded).toStrictEqual(testEvent);
  });

  it('should maintain consistency through decode -> encode -> decode round-trip', () => {
    const format = traceEventWalFormat();
    const originalEvent: TraceEvent = {
      name: 'cp:round-trip-test',
      ph: 'i',
      ts: 987_654_321,
      pid: 789,
      tid: 101,
      cat: 'blink.user_timing',
      args: {
        dataType: 'track-entry',
        track: 'Round Trip Track',
        trackGroup: 'Test Group',
        customField: 'custom value',
      },
    };

    const initialEncoded = format.codec.encode(originalEvent);
    const firstDecoded = format.codec.decode(initialEncoded);
    const secondEncoded = format.codec.encode(firstDecoded);
    const secondDecoded = format.codec.decode(secondEncoded);

    expect(secondDecoded).toStrictEqual(firstDecoded);
    expect(secondDecoded).toStrictEqual(originalEvent);
  });

  it('should finalize records into trace content', () => {
    const format = traceEventWalFormat();
    const records: TraceEvent[] = [
      {
        name: 'cp:operation:start',
        ph: 'i',
        ts: 1000,
        pid: 123,
        tid: 456,
        cat: 'blink.user_timing',
        args: { dataType: 'track-entry' },
      },
    ];

    const result = format.finalizer(records);

    expect(typeof result).toBe('string');
    const parsed = JSON.parse(result);
    expect(parsed).toHaveProperty('traceEvents');
    expect(parsed).toHaveProperty('metadata');
    expect(parsed.traceEvents).toBeArray();
  });

  it('should include generatedAt in finalizer metadata', () => {
    const format = traceEventWalFormat();
    const records: TraceEvent[] = [];

    const result = format.finalizer(records);
    const parsed = JSON.parse(result);

    expect(parsed.metadata).toHaveProperty('generatedAt');
    expect(typeof parsed.metadata.generatedAt).toBe('string');
    // Should be recent timestamp
    expect(new Date(parsed.metadata.generatedAt).getTime()).toBeGreaterThan(
      Date.now() - 10_000,
    );
  });
});
