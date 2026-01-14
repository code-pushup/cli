import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { teardownTestFolder } from '@code-pushup/test-utils';
import { TraceFileSink } from './file-sink-json-trace.js';
import type { TraceEvent } from './trace-file.type';

describe('TraceFileSink integration', () => {
  const baseDir = path.join(os.tmpdir(), 'file-sink-json-trace-int-tests');
  const traceJsonPath = path.join(baseDir, 'test-data.json');
  const traceJsonlPath = path.join(baseDir, 'test-data.jsonl');

  beforeAll(async () => {
    await fs.promises.mkdir(baseDir, { recursive: true });
  });

  beforeEach(async () => {
    try {
      await fs.promises.unlink(traceJsonPath);
    } catch {
      // File doesn't exist, which is fine
    }
    try {
      await fs.promises.unlink(traceJsonlPath);
    } catch {
      // File doesn't exist, which is fine
    }
  });

  afterAll(async () => {
    await teardownTestFolder(baseDir);
  });

  describe('file operations', () => {
    const testEvents: TraceEvent[] = [
      { name: 'navigationStart', ts: 100, ph: 'I', cat: 'blink.user_timing' },
      {
        name: 'loadEventStart',
        ts: 200,
        ph: 'I',
        cat: 'blink.user_timing',
        args: { data: { url: 'https://example.com' } },
      },
      {
        name: 'loadEventEnd',
        ts: 250,
        ph: 'I',
        cat: 'blink.user_timing',
        args: { detail: { duration: 50 } },
      },
    ];

    it('should write and read trace events', async () => {
      const sink = new TraceFileSink({
        filename: 'test-data',
        directory: baseDir,
      });

      // Open and write data
      sink.open();
      testEvents.forEach(event => sink.write(event as any));
      sink.finalize();

      expect(fs.existsSync(traceJsonPath)).toBe(true);
      expect(fs.existsSync(traceJsonlPath)).toBe(true);

      const jsonContent = fs.readFileSync(traceJsonPath, 'utf8');
      const traceData = JSON.parse(jsonContent);

      expect(traceData.metadata.source).toBe('DevTools');
      expect(traceData.metadata.dataOrigin).toBe('TraceEvents');
      expect(Array.isArray(traceData.traceEvents)).toBe(true);

      // Should have preamble events + user events + complete event
      expect(traceData.traceEvents.length).toBeGreaterThan(testEvents.length);

      // Check that our events are included
      const userEvents = traceData.traceEvents.filter((e: any) =>
        testEvents.some(testEvent => testEvent.name === e.name),
      );
      expect(userEvents).toHaveLength(testEvents.length);
    });

    it('should recover events from JSONL file', async () => {
      const sink = new TraceFileSink({
        filename: 'test-data',
        directory: baseDir,
      });
      sink.open();
      testEvents.forEach(event => sink.write(event as any));
      sink.close();

      const recovered = sink.recover();
      expect(recovered.records).toStrictEqual(testEvents);
      expect(recovered.errors).toStrictEqual([]);
      expect(recovered.partialTail).toBeNull();
    });

    it('should handle empty trace files', async () => {
      const sink = new TraceFileSink({
        filename: 'empty-test',
        directory: baseDir,
      });
      sink.open();
      sink.finalize();

      const emptyJsonPath = path.join(baseDir, 'empty-test.json');
      expect(fs.existsSync(emptyJsonPath)).toBe(true);

      const jsonContent = fs.readFileSync(emptyJsonPath, 'utf8');
      const traceData = JSON.parse(jsonContent);

      expect(traceData.metadata.source).toBe('DevTools');
      // Should have at least preamble and complete events
      expect(traceData.traceEvents.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle metadata in trace files', async () => {
      const metadata = {
        version: '1.0.0',
        environment: 'test',
        customData: { key: 'value' },
      };

      const sink = new TraceFileSink({
        filename: 'metadata-test',
        directory: baseDir,
        metadata,
      });
      sink.open();
      sink.write({ name: 'test-event', ts: 100, ph: 'I' } as any);
      sink.finalize();

      const metadataJsonPath = path.join(baseDir, 'metadata-test.json');
      const jsonContent = fs.readFileSync(metadataJsonPath, 'utf8');
      const traceData = JSON.parse(jsonContent);

      expect(traceData.metadata.version).toBe('1.0.0');
      expect(traceData.metadata.environment).toBe('test');
      expect(traceData.metadata.customData).toStrictEqual({ key: 'value' });
      expect(traceData.metadata.source).toBe('DevTools');
    });

    describe('edge cases', () => {
      it('should handle single event traces', async () => {
        const singleEvent: TraceEvent = {
          name: 'singleEvent',
          ts: 123,
          ph: 'I',
          cat: 'test',
        };

        const sink = new TraceFileSink({
          filename: 'single-event-test',
          directory: baseDir,
        });
        sink.open();
        sink.write(singleEvent as any);
        sink.finalize();

        const singleJsonPath = path.join(baseDir, 'single-event-test.json');
        const jsonContent = fs.readFileSync(singleJsonPath, 'utf8');
        const traceData = JSON.parse(jsonContent);

        expect(
          traceData.traceEvents.some((e: any) => e.name === 'singleEvent'),
        ).toBe(true);
      });

      it('should handle events with complex args', async () => {
        const complexEvent: TraceEvent = {
          name: 'complexEvent',
          ts: 456,
          ph: 'X',
          cat: 'test',
          args: {
            detail: { nested: { data: [1, 2, 3] } },
            data: { url: 'https://example.com', size: 1024 },
          },
        };

        const sink = new TraceFileSink({
          filename: 'complex-args-test',
          directory: baseDir,
        });
        sink.open();
        sink.write(complexEvent as any);
        sink.finalize();

        const complexJsonPath = path.join(baseDir, 'complex-args-test.json');
        const jsonContent = fs.readFileSync(complexJsonPath, 'utf8');
        const traceData = JSON.parse(jsonContent);

        const eventInTrace = traceData.traceEvents.find(
          (e: any) => e.name === 'complexEvent',
        );
        expect(eventInTrace).toBeDefined();
        expect(eventInTrace.args.detail).toStrictEqual(
          '{"nested":{"data":[1,2,3]}}',
        );
        expect(eventInTrace.args.data.url).toBe('https://example.com');
      });

      it('should handle non-existent directories gracefully', async () => {
        const nonExistentDir = path.join(baseDir, 'non-existent');
        const sink = new TraceFileSink({
          filename: 'non-existent-dir-test',
          directory: nonExistentDir,
        });

        sink.open();
        sink.write({ name: 'test', ts: 100, ph: 'I' } as any);
        sink.finalize();

        const jsonPath = path.join(
          nonExistentDir,
          'non-existent-dir-test.json',
        );
        expect(fs.existsSync(jsonPath)).toBe(true);
      });
    });
  });
});
