import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DevToolsOutputFormat,
  type ExtensionMarkerPayload,
  type ExtensionTrackEntryPayload,
  type OutputFormat,
  type ProfilingEvent,
} from './trace-file-output.js';

// Mock process.pid and threadId
vi.mock('node:worker_threads', () => ({
  threadId: 42,
}));

// Mock process
Object.defineProperty(process, 'pid', {
  value: 123,
  writable: true,
});

// Mock performance.now
const mockPerformanceNow = vi.fn();
Object.defineProperty(performance, 'now', {
  value: mockPerformanceNow,
  writable: true,
});

describe('DevToolsOutputFormat', () => {
  let format: DevToolsOutputFormat;

  beforeEach(() => {
    // Reset mocks
    mockPerformanceNow.mockReturnValue(1000); // 1 second in milliseconds
    vi.clearAllMocks();
    format = new DevToolsOutputFormat('/tmp/test-trace.jsonl');
  });

  describe('constructor', () => {
    it('should have correct id, fileExt, and filePath', () => {
      expect(format.id).toBe('devtools');
      expect(format.fileExt).toBe('jsonl');
      expect(format.filePath).toBe('/tmp/test-trace.jsonl');
    });
  });

  describe('preamble', () => {
    it('should return start tracing and run task events', () => {
      const events = format.preamble();

      expect(events).toHaveLength(2);
      const event0 = JSON.parse(events[0]!);
      expect(event0).toEqual({
        cat: 'devtools.timeline',
        name: 'TracingStartedInBrowser',
        ph: 'i',
        pid: 123,
        tid: 42,
        ts: expect.any(Number), // performance.now() * 1000
        s: 't',
        args: {
          data: {
            frameTreeNodeId: 123042, // getFrameTreeNodeId(123, 42)
            frames: [
              {
                frame: 'FRAME0P123T42', // getFrameName(123, 42)
                isInPrimaryMainFrame: true,
                isOutermostMainFrame: true,
                name: '',
                processId: 123,
                url: '/tmp/test-trace.jsonl',
              },
            ],
            persistentIds: true,
          },
        },
      });
      const runTaskEvent = JSON.parse(events[1]!);
      expect(runTaskEvent).toEqual({
        cat: 'devtools.timeline',
        name: 'RunTask',
        ph: 'X',
        pid: 123,
        tid: 42,
        ts: expect.any(Number),
        dur: 10,
        args: {},
      });
    });

    it('should use custom pid, tid, and url when provided', () => {
      const events = format.preamble({ pid: 999, tid: 888, url: 'custom-url' });

      expect(events).toHaveLength(2);
      const event0 = JSON.parse(events[0]!);
      expect(event0).toEqual({
        cat: 'devtools.timeline',
        name: 'TracingStartedInBrowser',
        ph: 'i',
        pid: 999,
        tid: 888,
        ts: expect.any(Number),
        s: 't',
        args: {
          data: {
            frameTreeNodeId: 9990888, // getFrameTreeNodeId(999, 888)
            frames: [
              {
                frame: 'FRAME0P999T888', // getFrameName(999, 888)
                isInPrimaryMainFrame: true,
                isOutermostMainFrame: true,
                name: '',
                processId: 999,
                url: 'custom-url',
              },
            ],
            persistentIds: true,
          },
        },
      });
      const customRunTaskEvent = JSON.parse(events[1]!);
      expect(customRunTaskEvent).toEqual({
        cat: 'devtools.timeline',
        name: 'RunTask',
        ph: 'X',
        pid: 999,
        tid: 888,
        ts: expect.any(Number),
        dur: 10,
        args: {},
      });
    });
  });

  describe('encode', () => {
    it('should encode mark events', () => {
      const markEvent: ProfilingEvent = {
        name: 'test-mark',
        entryType: 'mark',
        startTime: 500,
        duration: 0,
        detail: { custom: 'data' },
      } as PerformanceMark;

      const events = format.encode(markEvent);

      expect(events).toHaveLength(1);
      const parsed = JSON.parse(events[0]!);
      expect(parsed.cat).toBe('blink.user_timing');
      expect(parsed.name).toBe('test-mark');
      expect(parsed.ph).toBe('I');
      expect(parsed.s).toBe('t');
      expect(parsed.pid).toBe(123);
      expect(parsed.tid).toBe(42);
      expect(parsed.args).toEqual({
        data: {
          detail: '{"custom":"data"}',
          startTime: 500,
        },
      });
      expect(typeof parsed.ts).toBe('number');
    });

    it('should encode measure events', () => {
      const measureEvent: ProfilingEvent = {
        name: 'test-measure',
        entryType: 'measure',
        startTime: 300,
        duration: 200,
        detail: { custom: 'measure-data' },
      } as PerformanceMeasure;

      const events = format.encode(measureEvent);

      expect(events).toHaveLength(2);
      // Begin event
      const beginEvent = JSON.parse(events[0]!);
      expect(beginEvent).toEqual({
        cat: 'blink.user_timing',
        name: 'test-measure',
        ph: 'b',
        pid: 123,
        tid: 42,
        ts: expect.any(Number),
        id2: { local: '0x1' },
        args: {
          detail: '{"custom":"measure-data"}',
        },
      });
      // End event
      const endEvent = JSON.parse(events[1]!);
      expect(endEvent).toEqual({
        cat: 'blink.user_timing',
        name: 'test-measure',
        ph: 'e',
        pid: 123,
        tid: 42,
        ts: expect.any(Number), // startTime + duration * 1000
        id2: { local: '0x1' },
        args: {},
      });
    });

    it('should return empty array for unknown event types', () => {
      const unknownEvent = {
        entryType: 'unknown',
      } as ProfilingEvent;

      const events = format.encode(unknownEvent);

      expect(events).toEqual([]);
    });

    it('should use custom pid and tid when provided', () => {
      const markEvent: ProfilingEvent = {
        name: 'test-mark',
        entryType: 'mark',
        startTime: 500,
        duration: 0,
      } as PerformanceMark;

      const events = format.encode(markEvent, { pid: 999, tid: 888 });

      expect(events).toHaveLength(1);
      const parsedMarkEvent = JSON.parse(events[0]!);
      expect(parsedMarkEvent).toEqual({
        cat: 'blink.user_timing',
        name: 'test-mark',
        ph: 'I',
        pid: 999,
        tid: 888,
        ts: expect.any(Number),
        id2: { local: '0x1' },
        s: 't',
        args: {
          data: {
            startTime: 500,
          },
        },
      });
    });

    it('should encode mark events with undefined detail', () => {
      const markEvent: ProfilingEvent = {
        name: 'test-mark-undefined',
        entryType: 'mark',
        startTime: 600,
        duration: 0,
        detail: undefined,
      } as PerformanceMark;

      const events = format.encode(markEvent);

      expect(events).toHaveLength(1);
      const parsed = JSON.parse(events[0]!);
      expect(parsed.cat).toBe('blink.user_timing');
      expect(parsed.name).toBe('test-mark-undefined');
      expect(parsed.ph).toBe('I');
      expect(parsed.s).toBe('t');
      expect(parsed.pid).toBe(123);
      expect(parsed.tid).toBe(42);
      expect(parsed.args).toEqual({
        data: {
          startTime: 600,
        },
      });
      expect(typeof parsed.ts).toBe('number');
    });

    it('should encode mark events without detail property', () => {
      const markEvent: ProfilingEvent = {
        name: 'test-mark-no-detail',
        entryType: 'mark',
        startTime: 700,
        duration: 0,
      } as PerformanceMark;

      const events = format.encode(markEvent);

      expect(events).toHaveLength(1);
      const parsed = JSON.parse(events[0]!);
      expect(parsed.cat).toBe('blink.user_timing');
      expect(parsed.name).toBe('test-mark-no-detail');
      expect(parsed.ph).toBe('I');
      expect(parsed.s).toBe('t');
      expect(parsed.pid).toBe(123);
      expect(parsed.tid).toBe(42);
      expect(parsed.args).toEqual({
        data: {
          startTime: 700,
        },
      });
      expect(typeof parsed.ts).toBe('number');
    });

    it('should encode mark events with null detail', () => {
      const markEvent: ProfilingEvent = {
        name: 'test-mark-null',
        entryType: 'mark',
        startTime: 800,
        duration: 0,
        detail: null as unknown as Record<string, unknown>,
      } as PerformanceMark;

      const events = format.encode(markEvent);

      expect(events).toHaveLength(1);
      const parsed = JSON.parse(events[0]!);
      expect(parsed.args).toEqual({
        data: {
          startTime: 800,
        },
      });
    });

    it('should encode mark events with empty object detail', () => {
      const markEvent: ProfilingEvent = {
        name: 'test-mark-empty',
        entryType: 'mark',
        startTime: 900,
        duration: 0,
        detail: {},
      } as PerformanceMark;

      const events = format.encode(markEvent);

      expect(events).toHaveLength(1);
      const parsed = JSON.parse(events[0]!);
      expect(parsed.cat).toBe('blink.user_timing');
      expect(parsed.name).toBe('test-mark-empty');
      expect(parsed.ph).toBe('I');
      expect(parsed.s).toBe('t');
      expect(parsed.pid).toBe(123);
      expect(parsed.tid).toBe(42);
      expect(parsed.args).toEqual({
        data: {
          detail: '{}',
          startTime: 900,
        },
      });
      expect(typeof parsed.ts).toBe('number');
    });

    it('should encode mark events with ExtensionMarkerPayload', () => {
      const markerPayload: ExtensionMarkerPayload = {
        dataType: 'marker',
        color: 'secondary',
        properties: [
          ['key1', 'value1'],
          ['key2', 'value2'],
        ],
        tooltipText: 'Test marker tooltip',
      };
      const markEvent: ProfilingEvent = {
        name: 'test-mark-extension',
        entryType: 'mark',
        startTime: 1000,
        duration: 0,
        detail: { devtools: markerPayload },
      } as PerformanceMark;

      const events = format.encode(markEvent);

      expect(events).toHaveLength(1);
      const parsed = JSON.parse(events[0]!);
      expect(parsed.cat).toBe('blink.user_timing');
      expect(parsed.name).toBe('test-mark-extension');
      expect(parsed.ph).toBe('I');
      expect(parsed.s).toBe('t');
      expect(parsed.args.data.detail).toBe(
        JSON.stringify({ devtools: markerPayload }),
      );
      expect(parsed.args.data.startTime).toBe(1000);
    });

    it('should encode measure events with undefined detail', () => {
      const measureEvent: ProfilingEvent = {
        name: 'test-measure-undefined',
        entryType: 'measure',
        startTime: 400,
        duration: 100,
        detail: undefined,
      } as PerformanceMeasure;

      const events = format.encode(measureEvent);

      expect(events).toHaveLength(2);
      expect(JSON.parse(events[0]!).args).toEqual({});
      expect(JSON.parse(events[1]!).args).toEqual({});
    });

    it('should encode measure events without detail property', () => {
      const measureEvent: ProfilingEvent = {
        name: 'test-measure-no-detail',
        entryType: 'measure',
        startTime: 500,
        duration: 150,
      } as PerformanceMeasure;

      const events = format.encode(measureEvent);

      expect(events).toHaveLength(2);
      expect(JSON.parse(events[0]!).args).toEqual({});
      expect(JSON.parse(events[1]!).args).toEqual({});
    });

    it('should encode measure events with null detail', () => {
      const measureEvent: ProfilingEvent = {
        name: 'test-measure-null',
        entryType: 'measure',
        startTime: 600,
        duration: 200,
        detail: null as unknown as Record<string, unknown>,
      } as PerformanceMeasure;

      const events = format.encode(measureEvent);

      expect(events).toHaveLength(2);
      const beginParsed = JSON.parse(events[0]!);
      expect(beginParsed.args).toEqual({});
      expect(JSON.parse(events[1]!).args).toEqual({});
    });

    it('should encode measure events with empty object detail', () => {
      const measureEvent: ProfilingEvent = {
        name: 'test-measure-empty',
        entryType: 'measure',
        startTime: 700,
        duration: 250,
        detail: {},
      } as PerformanceMeasure;

      const events = format.encode(measureEvent);

      expect(events).toHaveLength(2);
      const emptyEvent = JSON.parse(events[0]!);
      expect(emptyEvent).toEqual({
        cat: 'blink.user_timing',
        name: 'test-measure-empty',
        ph: 'b',
        pid: 123,
        tid: 42,
        ts: expect.any(Number),
        id2: { local: '0x5' },
        args: {
          detail: '{}',
        },
      });
      expect(JSON.parse(events[1]!).args).toEqual({});
    });

    it('should encode measure events with ExtensionTrackEntryPayload', () => {
      const trackPayload: ExtensionTrackEntryPayload = {
        dataType: 'track-entry',
        track: 'Custom Track',
        trackGroup: 'Test Group',
        color: 'tertiary',
        properties: [
          ['Duration', '100ms'],
          ['Status', 'success'],
        ],
        tooltipText: 'Test track entry tooltip',
      };
      const measureEvent: ProfilingEvent = {
        name: 'test-measure-extension',
        entryType: 'measure',
        startTime: 800,
        duration: 300,
        detail: { devtools: trackPayload },
      } as PerformanceMeasure;

      const events = format.encode(measureEvent);

      expect(events).toHaveLength(2);
      const beginParsed = JSON.parse(events[0]!);
      expect(beginParsed.args.detail).toBe(
        JSON.stringify({ devtools: trackPayload }),
      );
      expect(JSON.parse(events[1]!).args).toEqual({});
    });

    it('should encode measure events with ExtensionMarkerPayload', () => {
      const markerPayload: ExtensionMarkerPayload = {
        dataType: 'marker',
        color: 'error',
        properties: [['Error', 'Test error']],
        tooltipText: 'Error marker',
      };
      const measureEvent: ProfilingEvent = {
        name: 'test-measure-marker',
        entryType: 'measure',
        startTime: 900,
        duration: 350,
        detail: { devtools: markerPayload },
      } as PerformanceMeasure;

      const events = format.encode(measureEvent);

      expect(events).toHaveLength(2);
      const beginParsed = JSON.parse(events[0]!);
      expect(beginParsed.args.detail).toBe(
        JSON.stringify({ devtools: markerPayload }),
      );
      expect(JSON.parse(events[1]!).args).toEqual({});
    });

    it('should encode events with complex nested detail structures', () => {
      const complexDetail = {
        devtools: {
          dataType: 'track-entry' as const,
          track: 'Complex Track',
          properties: [
            ['Nested', JSON.stringify({ deep: { value: 123 } })],
            ['Array', JSON.stringify([1, 2, 3])],
          ],
        },
        custom: { nested: { data: 'value' } },
      };
      const markEvent: ProfilingEvent = {
        name: 'test-mark-complex',
        entryType: 'mark',
        startTime: 1100,
        duration: 0,
        detail: complexDetail,
      } as PerformanceMark;

      const events = format.encode(markEvent);

      expect(events).toHaveLength(1);
      const parsed = JSON.parse(events[0]!);
      expect(parsed.args.data.detail).toBe(JSON.stringify(complexDetail));
    });
  });

  describe('epilogue', () => {
    it('should return run task event', () => {
      const events = format.epilogue();

      expect(events).toHaveLength(1);
      const runTaskEvent = JSON.parse(events[0]!);
      expect(runTaskEvent).toEqual({
        cat: 'devtools.timeline',
        name: 'RunTask',
        ph: 'X',
        pid: 123,
        tid: 42,
        ts: expect.any(Number),
        dur: 10,
        args: {},
      });
    });

    it('should use custom pid and tid when provided', () => {
      const events = format.epilogue({ pid: 999, tid: 888 });

      expect(events).toHaveLength(1);
      const customRunTaskEvent = JSON.parse(events[0]!);
      expect(customRunTaskEvent).toEqual({
        cat: 'devtools.timeline',
        name: 'RunTask',
        ph: 'X',
        pid: 999,
        tid: 888,
        ts: expect.any(Number),
        dur: 10,
        args: {},
      });
    });
  });

  describe('interface compliance', () => {
    it('should implement OutputFormat interface', () => {
      const outputFormat: OutputFormat = new DevToolsOutputFormat(
        '/tmp/test.jsonl',
      );

      expect(typeof outputFormat.id).toBe('string');
      expect(typeof outputFormat.filePath).toBe('string');
      expect(Array.isArray(outputFormat.preamble())).toBe(true);
      expect(
        Array.isArray(
          outputFormat.encode({ entryType: 'mark' } as ProfilingEvent),
        ),
      ).toBe(true);
      expect(Array.isArray(outputFormat.epilogue())).toBe(true);
    });

    it('should have fileExt property', () => {
      const format = new DevToolsOutputFormat('/tmp/test.jsonl');
      expect(typeof format.fileExt).toBe('string');
      expect(format.fileExt).toBe('jsonl');
    });
  });

  describe('internal state', () => {
    it('should generate unique ids for each instance', () => {
      const format1 = new DevToolsOutputFormat('/tmp/test1.jsonl');
      const format2 = new DevToolsOutputFormat('/tmp/test2.jsonl');

      const event1: ProfilingEvent = {
        name: 'test',
        entryType: 'mark',
        startTime: 100,
        duration: 0,
      } as PerformanceMark;

      const event2: ProfilingEvent = {
        name: 'test',
        entryType: 'mark',
        startTime: 200,
        duration: 0,
      } as PerformanceMark;

      const events1 = format1.encode(event1);
      const events2 = format2.encode(event2);

      // Each format instance should have its own id counter
      expect(JSON.parse(events1[0]!).id2.local).toBe('0x1');
      expect(JSON.parse(events2[0]!).id2.local).toBe('0x1');
    });
  });
});
