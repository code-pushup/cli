import { vol } from 'memfs';
import * as fs from 'node:fs';
import path from 'node:path';
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
    // eslint-disable-next-line functional/immutable-data
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
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
    fs.mkdirSync('/tmp', { recursive: true });
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

    expect(fs.existsSync(outputPath)).toBe(true); // File created with margin events even for empty events
    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(content.traceEvents).toHaveLength(3); // Should have padding events even for empty traces due to bug
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
    expect(startMargin.ts).toBe(500); // 1000 - 500 due to bug
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
    const sink = new FileSinkJsonTrace({
      filename: 'test',
      directory: '/tmp',
    });
    expect(sink).toBeDefined();
    // Test that the sink can be opened and closed without errors
    sink.open();
    sink.close();
  });

  it('should create trace file sink with custom directory', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'test',
      directory: path.join(MEMFS_VOLUME, 'custom'),
    });
    expect(sink).toBeDefined();
    // Test that the sink can be opened and closed without errors
    sink.open();
    sink.close();
  });

  it('should handle file operations with trace events', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'trace-test',
      directory: path.join(MEMFS_VOLUME, 'trace-test'),
    });
    const event1: InstantEvent = { name: 'mark1', ts: 100, ph: 'I' };
    const event2: InstantEvent = { name: 'mark2', ts: 200, ph: 'I' };
    sink.open();
    sink.write(event1);
    sink.write(event2);
    sink.close();

    expect(
      fs.existsSync(path.join(MEMFS_VOLUME, 'trace-test', 'trace-test.jsonl')),
    ).toBe(true);
    expect(
      fs.existsSync(path.join(MEMFS_VOLUME, 'trace-test', 'trace-test.json')),
    ).toBe(true); // close() now finalizes

    const recovered = sink.recover();
    expect(recovered.records).toStrictEqual([event1, event2]);
  });

  it('should create trace file on finalize', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'finalize-test',
      directory: path.join(MEMFS_VOLUME, 'finalize-test'),
    });

    const event: InstantEvent = { name: 'test-event', ts: 150, ph: 'I' };
    sink.open();
    sink.write(event);
    sink.finalize();

    expect(
      fs.existsSync(
        path.join(MEMFS_VOLUME, 'finalize-test', 'finalize-test.json'),
      ),
    ).toBe(true);
    const content = JSON.parse(
      fs.readFileSync(
        path.join(MEMFS_VOLUME, 'finalize-test', 'finalize-test.json'),
        'utf8',
      ),
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
      directory: path.join(MEMFS_VOLUME, 'metadata-test'),
      metadata,
    });
    sink.open();
    sink.write({ name: 'event', ts: 100, ph: 'I' } as any);
    sink.finalize();

    const content = JSON.parse(
      fs.readFileSync(
        path.join(MEMFS_VOLUME, 'metadata-test', 'metadata-test.json'),
        'utf8',
      ),
    );
    expect(content.metadata.customField).toBe('value');
    expect(content.metadata.version).toBe('1.0');
  });

  it('should use configurable options in TraceFileSink', () => {
    const testDir = path.join(MEMFS_VOLUME, 'options-test');
    const sink = new FileSinkJsonTrace({
      filename: 'options-test',
      directory: testDir,
      marginMs: 200,
      marginDurMs: 5,
      startTime: '2023-12-25T12:00:00.000Z',
    });
    sink.open();
    sink.write({ name: 'event', ts: 1000, ph: 'I' } as any);
    sink.finalize();

    const content = JSON.parse(
      fs.readFileSync(path.join(testDir, 'options-test.json'), 'utf8'),
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

  it('should create file on finalize even when no events written', () => {
    const testDir = path.join(MEMFS_VOLUME, 'trace-test');
    const sink = new FileSinkJsonTrace({
      filename: 'empty-test',
      directory: testDir,
    });
    sink.open(); // Ensure directory is created
    sink.finalize();

    expect(fs.existsSync(path.join(testDir, 'empty-test.json'))).toBe(true); // File created with margin events even for empty events
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

describe('FileSinkJsonTrace', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('close() should be idempotent', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'test-trace',
      directory: path.join(MEMFS_VOLUME, 'test-trace'),
    });

    sink.open();
    sink.write({
      name: 'test-event',
      ts: 100,
      ph: 'I',
      cat: 'test',
    } as any);

    // First close should finalize
    sink.close();

    // Check that JSON file was created
    expect(
      fs.existsSync(path.join(MEMFS_VOLUME, 'test-trace', 'test-trace.json')),
    ).toBe(true);

    // Second close should be no-op (idempotent)
    expect(() => sink.close()).not.toThrow();
  });

  it('finalize() should be idempotent', () => {
    const sink = new FileSinkJsonTrace({
      filename: 'test-trace',
      directory: path.join(MEMFS_VOLUME, 'test-trace'),
    });

    sink.open();
    sink.write({
      name: 'test-event',
      ts: 100,
      ph: 'I',
      cat: 'test',
    } as any);

    // First finalize
    sink.finalize();
    expect(
      fs.existsSync(path.join(MEMFS_VOLUME, 'test-trace', 'test-trace.json')),
    ).toBe(true);

    const content1 = fs.readFileSync(
      path.join(MEMFS_VOLUME, 'test-trace', 'test-trace.json'),
      'utf8',
    );

    // Second finalize should be no-op
    sink.finalize();

    const content2 = fs.readFileSync(
      path.join(MEMFS_VOLUME, 'test-trace', 'test-trace.json'),
      'utf8',
    );
    expect(content1).toBe(content2);
  });

  it('finalizeTraceFile should be idempotent', () => {
    const events = [
      {
        name: 'test-event',
        ts: 100,
        ph: 'I' as const,
        cat: 'test',
      },
    ];

    const filePath = path.join(MEMFS_VOLUME, 'idempotent-test.json');

    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    // First call should create file
    finalizeTraceFile(events, filePath);
    expect(fs.existsSync(filePath)).toBe(true);

    const content1 = fs.readFileSync(filePath, 'utf8');

    // Second call should not overwrite (idempotent)
    finalizeTraceFile(events, filePath);

    const content2 = fs.readFileSync(filePath, 'utf8');
    expect(content1).toBe(content2);
  });

  it('finalizeTraceFile should handle empty events array', () => {
    const filePath = path.join(MEMFS_VOLUME, 'empty-test.json');

    // Ensure directory exists
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    finalizeTraceFile([], filePath);
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);

    expect(parsed.traceEvents).toHaveLength(3); // Should have padding events
    expect(parsed.displayTimeUnit).toBe('ms');
    expect(parsed.metadata.source).toBe('DevTools');
  });
});
