import { performance } from 'node:perf_hooks';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  entryToTraceTimestamp,
  getCompleteEvent,
  getFrameName,
  getFrameTreeNodeId,
  getInstantEvent,
  getSpanEvent,
  getStartTracing,
  measureToSpanEvents,
  traceTimeToDate,
  traceTimestampToDate,
} from './trace-file-utils.js';

describe('trace-file-utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('traceTimeToDate', () => {
    it('should convert trace timestamp to Date', () => {
      const traceTimeUs = 1000000; // 1 second in microseconds
      const date = traceTimeToDate(traceTimeUs);
      expect(date).toBeInstanceOf(Date);
    });

    it('should handle zero timestamp', () => {
      const date = traceTimeToDate(0);
      expect(date.getTime()).toBeGreaterThan(0); // Should be epoch + trace zero
    });
  });

  describe('traceTimestampToDate', () => {
    it('should be alias for traceTimeToDate', () => {
      expect(traceTimestampToDate).toBe(traceTimeToDate);
    });
  });

  describe('entryToTraceTimestamp', () => {
    it('should convert performance mark timestamp', () => {
      const mark = performance.mark('test-mark');
      const timestamp = entryToTraceTimestamp(mark);
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeGreaterThan(0);
    });

    it('should convert performance measure start timestamp', () => {
      performance.mark('start');
      performance.mark('end');
      const measure = performance.measure('test-measure', 'start', 'end');
      const startTimestamp = entryToTraceTimestamp(measure, false);
      expect(typeof startTimestamp).toBe('number');
      expect(startTimestamp).toBeGreaterThan(0);
    });

    it('should convert performance measure end timestamp', () => {
      performance.mark('start');
      performance.mark('end');
      const measure = performance.measure('test-measure', 'start', 'end');
      const endTimestamp = entryToTraceTimestamp(measure, true);
      const startTimestamp = entryToTraceTimestamp(measure, false);
      expect(endTimestamp).toBeGreaterThan(startTimestamp);
    });
  });

  describe('getInstantEvent', () => {
    it('should create instant event with required fields', () => {
      const event = getInstantEvent({
        name: 'test-event',
        pid: 123,
        tid: 456,
        ts: 1000000,
      });

      expect(event).toEqual({
        cat: 'blink.user_timing',
        s: 't',
        ph: 'I',
        name: 'test-event',
        pid: 123,
        tid: 456,
        ts: 1000000,
        args: {
          data: {
            detail: undefined,
          },
        },
      });
    });

    it('should handle optional args', () => {
      const event = getInstantEvent({
        name: 'test-event',
        args: {
          data: {
            detail: {
              devtools: {
                dataType: 'marker',
                color: 'blue',
              },
            },
          },
        },
      });

      expect(event.args.data.detail).toBe(
        '{"devtools":{"dataType":"marker","color":"blue"}}',
      );
    });
  });

  describe('getSpanEvent', () => {
    it('should create begin event', () => {
      const event = getSpanEvent('b', {
        name: 'test-span',
        id2: { local: '0x1' },
        pid: 123,
        tid: 456,
        ts: 1000000,
      });

      expect(event.ph).toBe('b');
      expect(event.name).toBe('test-span');
      expect(event.id2).toEqual({ local: '0x1' });
      expect(event.pid).toBe(123);
      expect(event.tid).toBe(456);
      expect(event.ts).toBe(1000000);
    });

    it('should create end event', () => {
      const event = getSpanEvent('e', {
        name: 'test-span',
        id2: { local: '0x1' },
        pid: 123,
        tid: 456,
        ts: 2000000,
      });

      expect(event.ph).toBe('e');
      expect(event.name).toBe('test-span');
      expect(event.id2).toEqual({ local: '0x1' });
    });

    it('should handle args with detail', () => {
      const event = getSpanEvent('b', {
        name: 'test-span',
        id2: { local: '0x1' },
        args: {
          detail: {
            devtools: {
              dataType: 'track-entry',
              track: 'test-track',
            },
          },
        },
      });

      expect(event.args.detail).toBe(
        '{"devtools":{"dataType":"track-entry","track":"test-track"}}',
      );
    });
  });

  describe('measureToSpanEvents', () => {
    it('should convert performance measure to span events', () => {
      performance.mark('start');
      performance.mark('end');
      const measure = performance.measure('test-measure', 'start', 'end');

      const [begin, end] = measureToSpanEvents(measure, { pid: 123, tid: 456 });

      expect(begin.ph).toBe('b');
      expect(begin.name).toBe('test-measure');
      expect(begin.pid).toBe(123);
      expect(begin.tid).toBe(456);
      expect(begin.id2).toBeDefined();

      expect(end.ph).toBe('e');
      expect(end.name).toBe('test-measure');
      expect(end.id2).toBe(begin.id2);
      expect(end.ts).toBeGreaterThan(begin.ts);
    });

    it('should use default pid and tid', () => {
      performance.mark('start');
      performance.mark('end');
      const measure = performance.measure('test-measure', 'start', 'end');

      const [begin, end] = measureToSpanEvents(measure);

      expect(begin.pid).toBeDefined();
      expect(begin.tid).toBeDefined();
      expect(end.pid).toBe(begin.pid);
      expect(end.tid).toBe(begin.tid);
    });
  });

  describe('getFrameTreeNodeId', () => {
    it('should generate frame tree node id', () => {
      const nodeId = getFrameTreeNodeId(123, 456);
      expect(nodeId).toBe(1230456);
    });

    it('should handle different pid and tid combinations', () => {
      expect(getFrameTreeNodeId(1, 2)).toBe(102);
      expect(getFrameTreeNodeId(999, 888)).toBe(9990888);
    });
  });

  describe('getFrameName', () => {
    it('should generate frame name', () => {
      const frameName = getFrameName(123, 456);
      expect(frameName).toBe('FRAME0P123T456');
    });

    it('should handle different pid and tid combinations', () => {
      expect(getFrameName(1, 2)).toBe('FRAME0P1T2');
      expect(getFrameName(999, 888)).toBe('FRAME0P999T888');
    });
  });

  describe('getStartTracing', () => {
    it('should create tracing started event', () => {
      const event = getStartTracing({
        url: 'http://example.com',
        pid: 123,
        tid: 456,
        ts: 1000000,
      });

      expect(event.cat).toBe('devtools.timeline');
      expect(event.ph).toBe('I');
      expect(event.name).toBe('TracingStartedInBrowser');
      expect(event.pid).toBe(123);
      expect(event.tid).toBe(456);
      expect(event.ts).toBe(1000000);
      expect(event.args.data.frames).toHaveLength(1);
      expect(event.args.data.frames[0].url).toBe('http://example.com');
    });

    it('should generate frame tree node id and frame name correctly', () => {
      const event = getStartTracing({
        url: 'http://example.com',
        pid: 123,
        tid: 456,
      });

      expect(event.args.data.frameTreeNodeId).toBe(1230456);
      expect(event.args.data.frames[0].frame).toBe('FRAME0P123T456');
    });
  });

  describe('getCompleteEvent', () => {
    it('should create complete event', () => {
      const event = getCompleteEvent({
        dur: 5000000, // 5 seconds in microseconds
        pid: 123,
        tid: 456,
        ts: 1000000,
      });

      expect(event.cat).toBe('devtools.timeline');
      expect(event.ph).toBe('X');
      expect(event.name).toBe('RunTask');
      expect(event.pid).toBe(123);
      expect(event.tid).toBe(456);
      expect(event.ts).toBe(1000000);
      expect(event.dur).toBe(5000000);
      expect(event.args).toEqual({});
    });
  });
});
