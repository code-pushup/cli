import { vol } from 'memfs';
import * as fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  FileSinkJsonTrace,
  finalizeTraceFile,
} from './file-sink-json-trace.js';
import {
  decodeTraceEvent,
  encodeTraceEvent,
  getTraceMetadata,
} from './trace-file-utils.js';
import type {
  InstantEvent,
  TraceEvent,
  TraceEventRaw,
} from './trace-file.type';

describe('decodeTraceEvent', () => {
  it('should return event without args if no args present', () => {
    const event: TraceEventRaw = { name: 'test', ts: 123 };
    expect(decodeTraceEvent(event)).toStrictEqual(event);
  });

  it('should decode args with detail property', () => {
    const event: TraceEventRaw = {
      name: 'test',
      ts: 123,
      args: { detail: '{"key":"value"}' },
    };
    expect(decodeTraceEvent(event)).toStrictEqual({
      name: 'test',
      ts: 123,
      args: { detail: { key: 'value' } },
    });
  });

  it('should decode nested data.detail property', () => {
    const event: TraceEventRaw = {
      name: 'test',
      ts: 123,
      args: { data: { detail: '{"nested":"value"}' } },
    };
    expect(decodeTraceEvent(event)).toStrictEqual({
      name: 'test',
      ts: 123,
      args: { data: { detail: { nested: 'value' } } },
    });
  });

  it('should handle invalid JSON in detail', () => {
    const event: TraceEventRaw = {
      name: 'test',
      ts: 123,
      args: { detail: 'invalid json' },
    };
    expect(() => decodeTraceEvent(event)).toThrow('Unexpected token');
  });
});

describe('encodeTraceEvent', () => {
  it('should return event without args if no args present', () => {
    const event: TraceEventRaw = { name: 'test', ts: 123 };
    expect(encodeTraceEvent(event)).toStrictEqual(event);
  });

  it('should encode args with detail property', () => {
    const event: TraceEventRaw = {
      name: 'test',
      ts: 123,
      args: { detail: { key: 'value' } },
    };
    expect(encodeTraceEvent(event)).toStrictEqual({
      name: 'test',
      ts: 123,
      args: { detail: '{"key":"value"}' },
    });
  });

  it('should encode nested data.detail property', () => {
    const event: TraceEventRaw = {
      name: 'test',
      ts: 123,
      args: { data: { detail: { nested: 'value' } } },
    };
    expect(encodeTraceEvent(event)).toStrictEqual({
      name: 'test',
      ts: 123,
      args: { data: { detail: '{"nested":"value"}' } },
    });
  });

  it('should handle non-serializable detail', () => {
    const circular: any = {};
    circular.self = circular;
    const event: TraceEventRaw = {
      name: 'test',
      ts: 123,
      args: { detail: circular },
    };
    expect(() => encodeTraceEvent(event)).toThrow(
      'Converting circular structure to JSON',
    );
  });
});

describe('finalizeTraceFile', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        '/tmp': null,
      },
      MEMFS_VOLUME,
    );
  });

  it('should create trace file with events', () => {
    const events: TraceEvent[] = [
      { name: 'event1', ts: 100, ph: 'I' },
      { name: 'event2', ts: 200, ph: 'X', args: { dur: 50 } },
    ];
    const outputPath = '/tmp/test-trace.json';

    finalizeTraceFile(events as any, outputPath);

    expect(fs.existsSync(outputPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(content.metadata.source).toBe('DevTools');
    expect(content.traceEvents).toHaveLength(5); // preamble (start + complete) + events + complete
  });

  it('should handle empty events array', () => {
    const events: TraceEvent[] = [];
    const outputPath = '/tmp/empty-trace.json';

    finalizeTraceFile(events as any, outputPath);

    expect(fs.existsSync(outputPath)).toBe(false); // No file created for empty events
  });

  it('should sort events by timestamp', () => {
    const events: TraceEvent[] = [
      { name: 'event2', ts: 200, ph: 'I' },
      { name: 'event1', ts: 100, ph: 'I' },
    ];
    const outputPath = '/tmp/sorted-trace.json';

    finalizeTraceFile(events as any, outputPath);

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    const eventNames = content.traceEvents
      .filter((e: any) => e.name.startsWith('event'))
      .map((e: any) => e.name);
    expect(eventNames).toStrictEqual(['event1', 'event2']);
  });

  it('should use configurable margins', () => {
    const events: TraceEvent[] = [{ name: 'event1', ts: 1000, ph: 'I' }];
    const outputPath = '/tmp/custom-margin-trace.json';

    finalizeTraceFile(
      events as any,
      outputPath,
      {},
      { marginMs: 500, marginDurMs: 10 },
    );

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(content.traceEvents).toHaveLength(4); // start tracing + start margin + event + end margin

    // Check start margin timestamp and duration
    const startMargin = content.traceEvents.find(
      (e: any) => e.name === '[trace padding start]',
    );
    expect(startMargin.ts).toBe(500); // 1000 - 500
    expect(startMargin.dur).toBe(10);

    // Check end margin timestamp and duration
    const endMargin = content.traceEvents.find(
      (e: any) => e.name === '[trace padding end]',
    );
    expect(endMargin.ts).toBe(1500); // 1000 + 500
    expect(endMargin.dur).toBe(10);
  });

  it('should use deterministic startTime', () => {
    const events: TraceEvent[] = [{ name: 'event1', ts: 1000, ph: 'I' }];
    const outputPath = '/tmp/deterministic-trace.json';
    const fixedTime = '2023-01-15T10:30:00.000Z';

    finalizeTraceFile(events as any, outputPath, {}, { startTime: fixedTime });

    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(content.metadata.startTime).toBe(fixedTime);
  });
});

describe('TraceFileSink', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        '/tmp': null,
      },
      MEMFS_VOLUME,
    );
  });

  it('should create trace file sink with default options', () => {
    const sink = new FileSinkJsonTrace({ filename: 'test' });
    expect(sink.getFilePathForExt('json')).toBe('test.json');
    expect(sink.getFilePathForExt('jsonl')).toBe('test.jsonl');
  });

  it('should create trace file sink with custom directory', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'test',
      directory: '/tmp/custom',
    });
    expect(sink.getFilePathForExt('json')).toBe('/tmp/custom/test.json');
    expect(sink.getFilePathForExt('jsonl')).toBe('/tmp/custom/test.jsonl');
  });

  it('should handle file operations with trace events', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'trace-test',
      directory: '/tmp',
    });
    const event1: InstantEvent = { name: 'mark1', ts: 100, ph: 'I' };
    const event2: InstantEvent = { name: 'mark2', ts: 200, ph: 'I' };
    sink.write(event1);
    sink.write(event2);
    sink.close();

    expect(fs.existsSync('/tmp/trace-test.jsonl')).toBe(true);
    expect(fs.existsSync('/tmp/trace-test.json')).toBe(false);

    const recovered = sink.recover();
    expect(recovered.records).toStrictEqual([event1, event2]);
  });

  it('should create trace file on finalize', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'finalize-test',
      directory: '/tmp',
    });

    const event: InstantEvent = { name: 'test-event', ts: 150, ph: 'I' };
    sink.write(event);
    sink.finalize();

    expect(fs.existsSync('/tmp/finalize-test.json')).toBe(true);
    const content = JSON.parse(
      fs.readFileSync('/tmp/finalize-test.json', 'utf8'),
    );
    expect(content.metadata.source).toBe('DevTools');
    expect(content.traceEvents.some((e: any) => e.name === 'test-event')).toBe(
      true,
    );
  });

  it('should handle metadata in finalize', () => {
    const metadata = { customField: 'value', version: '1.0' };
    const sink = new FileSinkJsonTrace({
      filename: 'metadata-test',
      directory: '/tmp',
      metadata,
    });
    sink.write({ name: 'event', ts: 100, ph: 'I' });
    sink.finalize();

    const content = JSON.parse(
      fs.readFileSync('/tmp/metadata-test.json', 'utf8'),
    );
    expect(content.metadata.customField).toBe('value');
    expect(content.metadata.version).toBe('1.0');
  });

  it('should use configurable options in TraceFileSink', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'options-test',
      directory: '/tmp',
      marginMs: 200,
      marginDurMs: 5,
      startTime: '2023-12-25T12:00:00.000Z',
    });
    sink.write({ name: 'event', ts: 1000, ph: 'I' });
    sink.finalize();

    const content = JSON.parse(
      fs.readFileSync('/tmp/options-test.json', 'utf8'),
    );
    expect(content.metadata.startTime).toBe('2023-12-25T12:00:00.000Z');

    const startMargin = content.traceEvents.find(
      (e: any) => e.name === '[trace padding start]',
    );
    expect(startMargin.ts).toBe(800); // 1000 - 200
    expect(startMargin.dur).toBe(5);

    const endMargin = content.traceEvents.find(
      (e: any) => e.name === '[trace padding end]',
    );
    expect(endMargin.ts).toBe(1200); // 1000 + 200
    expect(endMargin.dur).toBe(5);
  });

  it('should do nothing on finalize when no events written', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'empty-test',
      directory: '/tmp',
    });
    sink.finalize();

    expect(fs.existsSync('/tmp/empty-test.json')).toBe(false); // No file created for empty events
  });
});

describe('getTraceMetadata', () => {
  it('should use provided startDate when given', () => {
    const startDate = new Date('2023-01-15T10:30:00.000Z');
    const metadata = { customField: 'value' };

    const result = getTraceMetadata(startDate, metadata);

    expect(result).toStrictEqual({
      source: 'DevTools',
      startTime: '2023-01-15T10:30:00.000Z',
      hardwareConcurrency: 1,
      dataOrigin: 'TraceEvents',
      customField: 'value',
    });
  });

  it('should use current date when startDate is undefined', () => {
    const beforeTest = new Date();
    const metadata = { version: '1.0' };

    const result = getTraceMetadata(undefined, metadata);

    const afterTest = new Date();
    expect(result.source).toBe('DevTools');
    expect(result.hardwareConcurrency).toBe(1);
    expect(result.dataOrigin).toBe('TraceEvents');

    // Verify startTime is a valid ISO string between test execution
    const startTime = new Date(result.startTime);
    expect(startTime.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    expect(startTime.getTime()).toBeLessThanOrEqual(afterTest.getTime());
  });

  it('should use current date when startDate is null', () => {
    const beforeTest = new Date();
    const metadata = { environment: 'test' };

    const result = getTraceMetadata(undefined, metadata);

    const afterTest = new Date();
    expect(result.source).toBe('DevTools');
    expect(result.hardwareConcurrency).toBe(1);
    expect(result.dataOrigin).toBe('TraceEvents');

    // Verify startTime is a valid ISO string between test execution
    const startTime = new Date(result.startTime);
    expect(startTime.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    expect(startTime.getTime()).toBeLessThanOrEqual(afterTest.getTime());
  });

  it('should handle empty metadata', () => {
    const startDate = new Date('2023-12-25T00:00:00.000Z');

    const result = getTraceMetadata(startDate);

    expect(result).toStrictEqual({
      source: 'DevTools',
      startTime: '2023-12-25T00:00:00.000Z',
      hardwareConcurrency: 1,
      dataOrigin: 'TraceEvents',
    });
  });

  it('should handle both startDate and metadata undefined', () => {
    const beforeTest = new Date();

    const result = getTraceMetadata();

    const afterTest = new Date();
    expect(result.source).toBe('DevTools');
    expect(result.hardwareConcurrency).toBe(1);
    expect(result.dataOrigin).toBe('TraceEvents');

    // Verify startTime is a valid ISO string between test execution
    const startTime = new Date(result.startTime);
    expect(startTime.getTime()).toBeGreaterThanOrEqual(beforeTest.getTime());
    expect(startTime.getTime()).toBeLessThanOrEqual(afterTest.getTime());
  });
});
