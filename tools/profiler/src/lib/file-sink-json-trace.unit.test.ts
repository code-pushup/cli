import { vol } from 'memfs';
import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TraceFileSink } from './file-sink-json-trace.js';
import type { SpanEvent } from './trace-file.type.js';

describe('TraceFileSink class', () => {
  it('should create with proper file paths', () => {
    const sink = new TraceFileSink({ filename: 'test' });
    expect(sink.getFilePathForExt('json')).toBe('test.json');
    expect(sink.getFilePathForExt('jsonl')).toBe('test.jsonl');
  });

  it('should create with custom directory', () => {
    const sink = new TraceFileSink({ filename: 'test', directory: '/custom' });
    expect(sink.getFilePathForExt('json')).toBe('/custom/test.json');
    expect(sink.getFilePathForExt('jsonl')).toBe('/custom/test.jsonl');
  });

  it('should finalize and create trace file', () => {
    const sink = new TraceFileSink({
      filename: 'finalize-test',
      directory: '/tmp',
    });
    const mockEvent: SpanEvent = {
      name: 'test-event',
      ts: 1000,
      dur: 500,
      ph: 'X',
      cat: 'test',
    };

    vol.fromJSON({
      '/tmp/finalize-test.jsonl': `${JSON.stringify(mockEvent)}\n`,
    });
    sink.finalize();

    expect(fs.existsSync('/tmp/finalize-test.json')).toBe(true);
    const content = fs.readFileSync('/tmp/finalize-test.json', 'utf8');
    expect(content).toContain('"test-event"');
    expect(content).toContain('"traceEvents":');
    expect(content).toContain('"metadata":');
  });

  it('should sort events by timestamp in final file', () => {
    const sink = new TraceFileSink({
      filename: 'sort-test',
      directory: '/tmp',
    });
    const events: SpanEvent[] = [
      { name: 'second', ts: 2000, dur: 100, ph: 'X', cat: 'test' },
      { name: 'first', ts: 1000, dur: 100, ph: 'X', cat: 'test' },
    ];

    vol.fromJSON({
      '/tmp/sort-test.jsonl':
        events.map(e => JSON.stringify(e)).join('\n') + '\n',
    });
    sink.finalize();

    const content = fs.readFileSync('/tmp/sort-test.json', 'utf8');
    const firstIndex = content.indexOf('"first"');
    const secondIndex = content.indexOf('"second"');
    expect(firstIndex).toBeLessThan(secondIndex);
  });

  it('should include custom metadata in final file', () => {
    const sink = new TraceFileSink({
      filename: 'metadata-test',
      directory: '/tmp',
      metadata: { version: '1.0', build: '123' },
    });
    const mockEvent: SpanEvent = {
      name: 'test-event',
      ts: 1000,
      dur: 500,
      ph: 'X',
      cat: 'test',
    };

    vol.fromJSON({
      '/tmp/metadata-test.jsonl': `${JSON.stringify(mockEvent)}\n`,
    });
    sink.finalize();

    const content = fs.readFileSync('/tmp/metadata-test.json', 'utf8');
    expect(content).toContain('version');
    expect(content).toContain('1.0');
    expect(content).toContain('build');
    expect(content).toContain('123');
  });
});
