import {
  createReadStream,
  createWriteStream,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DevToolsOutputFormat,
  type ExtensionMarkerPayload,
  type ExtensionTrackEntryPayload,
  type OutputFormat,
  type ProfilingEvent,
} from './output-format.js';

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
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'devtools.timeline',
        name: 'TracingStartedInBrowser',
        ph: 'i',
        pid: 123,
        tid: 42,
        ts: 1000000, // performance.now() * 1000
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
      expect(JSON.parse(events[1]!)).toEqual({
        cat: 'devtools.timeline',
        name: 'RunTask',
        ph: 'X',
        pid: 123,
        tid: 42,
        ts: 1000000,
        dur: 10,
        args: {},
      });
    });

    it('should use custom pid, tid, and url when provided', () => {
      const events = format.preamble({ pid: 999, tid: 888, url: 'custom-url' });

      expect(events).toHaveLength(2);
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'devtools.timeline',
        name: 'TracingStartedInBrowser',
        ph: 'i',
        pid: 999,
        tid: 888,
        ts: 1000000,
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
      expect(JSON.parse(events[1]!)).toEqual({
        cat: 'devtools.timeline',
        name: 'RunTask',
        ph: 'X',
        pid: 999,
        tid: 888,
        ts: 1000000,
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
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'blink.user_timing',
        name: 'test-mark',
        ph: 'b',
        pid: 123,
        tid: 42,
        ts: 500000, // startTime * 1000
        id2: { local: '0x1' },
        args: {
          detail: '{"custom":"data"}',
        },
      });
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
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'blink.user_timing',
        name: 'test-measure',
        ph: 'b',
        pid: 123,
        tid: 42,
        ts: 300000,
        id2: { local: '0x1' },
        args: {
          detail: '{"custom":"measure-data"}',
        },
      });
      // End event
      expect(JSON.parse(events[1]!)).toEqual({
        cat: 'blink.user_timing',
        name: 'test-measure',
        ph: 'e',
        pid: 123,
        tid: 42,
        ts: 500000, // startTime + duration * 1000
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
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'blink.user_timing',
        name: 'test-mark',
        ph: 'b',
        pid: 999,
        tid: 888,
        ts: 500000,
        id2: { local: '0x1' },
        args: {},
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
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'blink.user_timing',
        name: 'test-mark-undefined',
        ph: 'b',
        pid: 123,
        tid: 42,
        ts: 600000,
        id2: { local: '0x1' },
        args: {},
      });
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
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'blink.user_timing',
        name: 'test-mark-no-detail',
        ph: 'b',
        pid: 123,
        tid: 42,
        ts: 700000,
        id2: { local: '0x1' },
        args: {},
      });
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
        detail: 'null',
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
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'blink.user_timing',
        name: 'test-mark-empty',
        ph: 'b',
        pid: 123,
        tid: 42,
        ts: 900000,
        id2: { local: '0x1' },
        args: {
          detail: '{}',
        },
      });
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
      expect(parsed.ph).toBe('b');
      expect(parsed.args.detail).toBe(
        JSON.stringify({ devtools: markerPayload }),
      );
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
      expect(beginParsed.args).toEqual({
        detail: 'null',
      });
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
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'blink.user_timing',
        name: 'test-measure-empty',
        ph: 'b',
        pid: 123,
        tid: 42,
        ts: 700000,
        id2: { local: '0x1' },
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
      expect(parsed.args.detail).toBe(JSON.stringify(complexDetail));
    });
  });

  describe('epilogue', () => {
    it('should return run task event', () => {
      const events = format.epilogue();

      expect(events).toHaveLength(1);
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'devtools.timeline',
        name: 'RunTask',
        ph: 'X',
        pid: 123,
        tid: 42,
        ts: 1000000,
        dur: 10,
        args: {},
      });
    });

    it('should use custom pid and tid when provided', () => {
      const events = format.epilogue({ pid: 999, tid: 888 });

      expect(events).toHaveLength(1);
      expect(JSON.parse(events[0]!)).toEqual({
        cat: 'devtools.timeline',
        name: 'RunTask',
        ph: 'X',
        pid: 999,
        tid: 888,
        ts: 1000000,
        dur: 10,
        args: {},
      });
    });
  });

  describe('finalize', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = tmpdir();
    });

    it('should wrap JSONL content into JSON format', async () => {
      const filePath = path.join(tempDir, 'trace.jsonl');
      const jsonlContent = '{"event": "test1"}\n{"event": "test2"}\n';

      // Ensure directory exists
      mkdirSync(tempDir, { recursive: true });
      // Create initial JSONL file
      writeFileSync(filePath, jsonlContent);

      const testFormat = new DevToolsOutputFormat(filePath);
      await testFormat.finalize();

      const result = readFileSync(filePath, 'utf8');
      // Verify it contains the metadata structure
      expect(result).toContain('"metadata"');
      expect(result).toContain('"traceEvents"');
      expect(result).toContain('"dataOrigin": "TraceEvents"');
    });

    it('should handle empty file gracefully', async () => {
      const filePath = path.join(tempDir, 'empty.jsonl');

      // Ensure directory exists
      mkdirSync(tempDir, { recursive: true });
      // Create empty file
      writeFileSync(filePath, '');

      const testFormat = new DevToolsOutputFormat(filePath);
      await expect(testFormat.finalize()).resolves.not.toThrow();

      const result = readFileSync(filePath, 'utf8');
      expect(result).toContain('"traceEvents": [');
    });

    it('should handle non-existent files by creating them with proper structure', async () => {
      // Test with non-existent file - finalize should create it with proper JSON structure
      const filePath = path.join(tempDir, 'non-existent-file.jsonl');
      const testFormat = new DevToolsOutputFormat(filePath);

      await expect(testFormat.finalize()).resolves.not.toThrow();

      const result = readFileSync(filePath, 'utf8');
      expect(result).toContain('"metadata"');
      expect(result).toContain('"traceEvents"');
      expect(result).toContain('\n    ]\n}');
      // For empty file, traceEvents should be empty array
      expect(result).toMatch(/"traceEvents": \[\s*\]/);
    });

    it('should handle files with invalid content gracefully', async () => {
      // Test with file containing invalid content that might cause transform errors
      const filePath = path.join(tempDir, 'invalid-content.jsonl');

      // Ensure directory exists
      mkdirSync(tempDir, { recursive: true });
      // Create file with content that might cause issues
      writeFileSync(filePath, 'invalid json content\n');

      const testFormat = new DevToolsOutputFormat(filePath);
      await expect(testFormat.finalize()).resolves.not.toThrow();

      const result = readFileSync(filePath, 'utf8');
      expect(result).toContain('"traceEvents"');
    });

    it('should handle transform stream with empty chunks', async () => {
      const filePath = path.join(tempDir, 'empty-chunks.jsonl');
      // Ensure directory exists
      mkdirSync(tempDir, { recursive: true });
      // Create file with content that will result in empty chunks after filtering
      writeFileSync(filePath, '\n\n\n');

      const testFormat = new DevToolsOutputFormat(filePath);
      await testFormat.finalize();

      const result = readFileSync(filePath, 'utf8');
      expect(result).toContain('"traceEvents": [');
    });

    it('should handle transform stream with multiple chunks', async () => {
      const filePath = path.join(tempDir, 'multi-chunk.jsonl');
      const jsonlContent =
        '{"event": "chunk1"}\n{"event": "chunk2"}\n{"event": "chunk3"}\n';

      // Ensure directory exists
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(filePath, jsonlContent);

      const testFormat = new DevToolsOutputFormat(filePath);
      await testFormat.finalize();

      const result = readFileSync(filePath, 'utf8');
      // Verify the JSON structure is created
      expect(result).toContain('"traceEvents"');
      expect(result).toContain('"metadata"');
    });

    it('should handle transform stream with single line content', async () => {
      const filePath = path.join(tempDir, 'single-line.jsonl');
      const jsonlContent = '{"event": "single"}\n';

      mkdirSync(tempDir, { recursive: true });
      writeFileSync(filePath, jsonlContent);

      const testFormat = new DevToolsOutputFormat(filePath);
      await testFormat.finalize();

      const result = readFileSync(filePath, 'utf8');
      expect(result).toContain('"traceEvents"');
      expect(result).toContain('{"event": "single"}');
    });

    it('should handle transform stream with content ending without newline', async () => {
      const filePath = path.join(tempDir, 'no-trailing-newline.jsonl');
      const jsonlContent = '{"event": "test1"}\n{"event": "test2"}';

      mkdirSync(tempDir, { recursive: true });
      writeFileSync(filePath, jsonlContent);

      const testFormat = new DevToolsOutputFormat(filePath);
      await testFormat.finalize();

      const result = readFileSync(filePath, 'utf8');
      expect(result).toContain('"traceEvents"');
      expect(result).toContain('{"event": "test1"}');
      expect(result).toContain('{"event": "test2"}');
    });

    it('should handle transform stream with mixed empty and non-empty lines', async () => {
      const filePath = path.join(tempDir, 'mixed-lines.jsonl');
      const jsonlContent =
        '{"event": "test1"}\n\n{"event": "test2"}\n\n\n{"event": "test3"}\n';

      mkdirSync(tempDir, { recursive: true });
      writeFileSync(filePath, jsonlContent);

      const testFormat = new DevToolsOutputFormat(filePath);
      await testFormat.finalize();

      const result = readFileSync(filePath, 'utf8');
      expect(result).toContain('"traceEvents"');
      // Empty lines should be filtered out
      expect(result.match(/"event": "test\d"/g)).toHaveLength(3);
    });

    it('should throw error when pipeline fails', async () => {
      const filePath = path.join(tempDir, 'pipeline-error.jsonl');
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(filePath, '{"event": "test"}\n');

      // Import the module to spy on
      const streamPromises = await import('node:stream/promises');
      // Mock pipeline to reject
      const pipelineSpy = vi
        .spyOn(streamPromises, 'pipeline')
        .mockRejectedValue(new Error('Pipeline error'));

      const testFormat = new DevToolsOutputFormat(filePath);
      await expect(testFormat.finalize()).rejects.toThrow(
        `Failed to wrap trace JSON file: ${filePath}`,
      );

      pipelineSpy.mockRestore();
    });

    it('should throw error when createReadStream fails', async () => {
      const filePath = path.join(tempDir, 'read-error.jsonl');
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(filePath, '{"event": "test"}\n');

      // Import the module to spy on
      const fs = await import('node:fs');
      // Mock createReadStream to throw an error
      const createReadStreamSpy = vi
        .spyOn(fs, 'createReadStream')
        .mockImplementation(() => {
          throw new Error('Read stream error');
        });

      const testFormat = new DevToolsOutputFormat(filePath);
      await expect(testFormat.finalize()).rejects.toThrow(
        `Failed to wrap trace JSON file: ${filePath}`,
      );

      createReadStreamSpy.mockRestore();
    });

    it('should throw error when createWriteStream fails', async () => {
      const filePath = path.join(tempDir, 'write-error.jsonl');
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(filePath, '{"event": "test"}\n');

      // Import the module to spy on
      const fs = await import('node:fs');
      // Mock createWriteStream to throw an error
      const createWriteStreamSpy = vi
        .spyOn(fs, 'createWriteStream')
        .mockImplementation(() => {
          throw new Error('Write stream error');
        });

      const testFormat = new DevToolsOutputFormat(filePath);
      await expect(testFormat.finalize()).rejects.toThrow(
        `Failed to wrap trace JSON file: ${filePath}`,
      );

      createWriteStreamSpy.mockRestore();
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
      expect(typeof outputFormat.finalize).toBe('function');
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
