import type { UserTimingTraceEvent } from './trace-file.type.js';
import { generateTraceContent, traceEventWalFormat } from './wal-json-trace.js';

describe('generateTraceContent', () => {
  it('should generate trace content for empty events array', () => {
    const events: UserTimingTraceEvent[] = [];
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
    const events: UserTimingTraceEvent[] = [
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
    const events: UserTimingTraceEvent[] = [
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
    const events: UserTimingTraceEvent[] = [
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
    const testEvent: UserTimingTraceEvent = {
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

  it('should finalize records into trace content', () => {
    const format = traceEventWalFormat();
    const records: UserTimingTraceEvent[] = [
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
    const records: UserTimingTraceEvent[] = [];

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
