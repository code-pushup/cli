import { vol } from 'memfs';
import * as fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { AppendFileSink, JsonlFile } from './file-sink.js';

describe('AppendFileSink', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should create instance with file path', () => {
    const sink = new AppendFileSink('/tmp/test-append.txt');
    expect(sink).toBeInstanceOf(AppendFileSink);
  });

  it('open() should be idempotent', () => {
    const sink = new AppendFileSink('/tmp/test-append.txt');

    // First open should work
    sink.open();
    expect(sink.isClosed()).toBe(false);

    // Second open should be no-op
    sink.open();
    expect(sink.isClosed()).toBe(false);
  });

  it('close() should be idempotent', () => {
    const sink = new AppendFileSink('/tmp/test-append.txt');
    sink.open();
    expect(sink.isClosed()).toBe(false);

    // First close
    sink.close();
    expect(sink.isClosed()).toBe(true);

    // Second close should be no-op
    sink.close();
    expect(sink.isClosed()).toBe(true);
  });

  it('flush() should be idempotent when not opened', () => {
    const sink = new AppendFileSink('/tmp/test-append.txt');

    // Should not throw when not opened
    expect(() => sink.flush()).not.toThrow();
    expect(() => sink.flush()).not.toThrow();
  });

  it('should write lines with newlines', () => {
    const sink = new AppendFileSink('/tmp/test-append.txt');
    sink.open();

    sink.write('line1');
    sink.write('line2');

    sink.close();

    const content = fs.readFileSync('/tmp/test-append.txt', 'utf8');
    expect(content).toBe('line1\nline2\n');
  });

  it('should throw error when writing without opening', () => {
    const sink = new AppendFileSink('/tmp/test-append.txt');

    expect(() => sink.write('test')).toThrow('Sink not opened');
  });

  it('should read all lines', () => {
    vol.fromJSON({
      '/tmp/test-append.txt': 'line1\nline2\nline3\n',
    });

    const sink = new AppendFileSink('/tmp/test-append.txt');
    const lines = [...sink.readAll()];

    expect(lines).toStrictEqual(['line1', 'line2', 'line3']);
  });

  it('should handle empty files', () => {
    vol.fromJSON({
      '/tmp/test-append.txt': '',
    });

    const sink = new AppendFileSink('/tmp/test-append.txt');
    const lines = [...sink.readAll()];

    expect(lines).toStrictEqual([]);
  });

  it('should recover records from file', () => {
    vol.fromJSON({
      '/tmp/test-append.txt': 'line1\nline2\nline3\n',
    });

    const sink = new AppendFileSink('/tmp/test-append.txt');
    const result = sink.recover();

    expect(result.records).toStrictEqual(['line1', 'line2', 'line3']);
    expect(result.errors).toStrictEqual([]);
    expect(result.partialTail).toBeNull();
  });

  it('should recover with partial tail', () => {
    vol.fromJSON({
      '/tmp/test-append.txt': 'line1\nline2\nincomplete',
    });

    const sink = new AppendFileSink('/tmp/test-append.txt');
    const result = sink.recover();

    expect(result.records).toStrictEqual(['line1', 'line2']);
    expect(result.errors).toStrictEqual([]);
    expect(result.partialTail).toBe('incomplete');
  });

  it('repack() should be idempotent when file is clean', () => {
    vol.fromJSON({
      '/tmp/test-append.txt': 'line1\nline2\nline3\n',
    });

    const sink = new AppendFileSink('/tmp/test-append.txt');

    // First repack
    sink.repack();
    const content1 = fs.readFileSync('/tmp/test-append.txt', 'utf8');

    // Second repack should be no-op
    sink.repack();
    const content2 = fs.readFileSync('/tmp/test-append.txt', 'utf8');

    expect(content1).toBe(content2);
  });

  it('repack() should clean incomplete lines', () => {
    vol.fromJSON({
      '/tmp/test-append.txt': 'line1\nline2\nincomplete',
    });

    const sink = new AppendFileSink('/tmp/test-append.txt');
    sink.repack();

    const content = fs.readFileSync('/tmp/test-append.txt', 'utf8');
    expect(content).toBe('line1\nline2\n');
  });

  it('repack() should throw error when file is open', () => {
    const sink = new AppendFileSink('/tmp/test-append.txt');
    sink.open();

    expect(() => sink.repack()).toThrow('Cannot repack while open');
  });
});

describe('JsonlFile', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should create instance with file path and codecs', () => {
    const sink = new JsonlFile('/tmp/test.jsonl', JSON.stringify, JSON.parse);
    expect(sink).toBeInstanceOf(JsonlFile);
  });

  it('should encode/decode objects to/from JSON lines', () => {
    const sink = new JsonlFile('/tmp/test.jsonl', JSON.stringify, JSON.parse);
    sink.open();

    const obj1 = { name: 'test1', value: 42 };
    const obj2 = { name: 'test2', value: 24 };

    sink.write(obj1);
    sink.write(obj2);
    sink.close();

    const content = fs.readFileSync('/tmp/test.jsonl', 'utf8');
    expect(content).toBe(`${JSON.stringify(obj1)}\n${JSON.stringify(obj2)}\n`);

    const lines = [...sink.readAll()];
    expect(lines).toStrictEqual([obj1, obj2]);
  });

  it('recover() should decode raw JSON lines back to objects', () => {
    vol.fromJSON({
      '/tmp/test.jsonl':
        '{"name":"test1","value":42}\n{"name":"test2","value":24}\n',
    });

    const sink = new JsonlFile('/tmp/test.jsonl', JSON.stringify, JSON.parse);
    const result = sink.recover();

    expect(result.records).toStrictEqual([
      { name: 'test1', value: 42 },
      { name: 'test2', value: 24 },
    ]);
    expect(result.errors).toStrictEqual([]);
    expect(result.partialTail).toBeNull();
  });

  it('repack() should rewrite file with clean JSON lines', () => {
    vol.fromJSON({
      '/tmp/test.jsonl':
        '{"name":"test1","value":42}\n{"name":"test2","value":24}\n',
    });

    const sink = new JsonlFile('/tmp/test.jsonl', JSON.stringify, JSON.parse);
    sink.repack();

    const content = fs.readFileSync('/tmp/test.jsonl', 'utf8');
    expect(content).toBe(
      '{"name":"test1","value":42}\n{"name":"test2","value":24}\n',
    );
  });
});
