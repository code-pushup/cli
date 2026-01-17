import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  type Codec,
  ShardedWal,
  WriteAheadLogFile,
  createTolerantCodec,
  filterValidRecords,
  getShardId,
  getShardedGroupId,
  isLeaderWal,
  parseWalFormat,
  recoverFromContent,
  setLeaderWal,
  stringCodec,
} from './wal.js';

const read = (p: string) => vol.readFileSync(p, 'utf8');
const write = (p: string, c: string) => vol.writeFileSync(p, c);

const simpleStringCodec: Codec<string> = { encode: v => v, decode: v => v };

const wal = <T>(
  file: string,
  codec: Codec<T> = simpleStringCodec as Codec<T>,
) => new WriteAheadLogFile({ file, codec });

describe('createTolerantCodec', () => {
  it('should make decode tolerant but encode passes through errors', () => {
    const c = createTolerantCodec({
      encode: (_n: number) => {
        throw new Error('encoding error');
      },
      decode: (_s: string) => {
        throw new Error('decoding error');
      },
    });
    expect(() => c.encode(42)).toThrow('encoding error');
    const result = c.decode('42');
    expect(result).toEqual({ __invalid: true, raw: '42' });
  });

  it('round-trips valid values and preserves invalid ones', () => {
    const c = createTolerantCodec({
      encode: (n: number) => `${n}`,
      decode: (s: string) => {
        const num = Number(s);
        if (Number.isNaN(num)) throw new Error('Invalid number');
        return num;
      },
    });
    expect(c.decode(c.encode(42))).toBe(42);

    const invalid = c.decode('x');
    expect(invalid).toStrictEqual({ __invalid: true, raw: 'x' });
    expect(c.encode(invalid)).toBe('x');
  });
});

describe('filterValidRecords', () => {
  it('filters out invalid records', () => {
    const records = [
      { id: 1, name: 'valid1' },
      { __invalid: true, raw: 'x' },
      { id: 3, name: 'valid3' },
    ];
    const result = filterValidRecords(records);
    expect(result).toEqual([
      { id: 1, name: 'valid1' },
      { id: 3, name: 'valid3' },
    ]);
  });
});

describe('recoverFromContent', () => {
  it('recovers valid records', () => {
    const content = 'a\nb\n';
    const result = recoverFromContent(content, simpleStringCodec.decode);
    expect(result).toEqual({
      records: ['a', 'b'],
      errors: [],
      partialTail: null,
    });
  });

  it('handles empty content', () => {
    const content = '';
    const result = recoverFromContent(content, simpleStringCodec.decode);
    expect(result).toEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });

  it('handles content without trailing newline', () => {
    const content = 'a\nb';
    const result = recoverFromContent(content, simpleStringCodec.decode);
    expect(result).toEqual({
      records: ['a'],
      errors: [],
      partialTail: 'b',
    });
  });

  it('skips empty lines', () => {
    const content = 'a\n\nb\n';
    const result = recoverFromContent(content, simpleStringCodec.decode);
    expect(result).toEqual({
      records: ['a', 'b'],
      errors: [],
      partialTail: null,
    });
  });

  it('handles decode errors gracefully', () => {
    const failingCodec: Codec<string> = {
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'bad') throw new Error('Bad record');
        return s;
      },
    };

    const content = 'good\nbad\ngood\n';
    const result = recoverFromContent(content, failingCodec.decode);

    expect(result.records).toEqual(['good', 'good']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      lineNo: 2,
      line: 'bad',
      error: expect.any(Error),
    });
    expect(result.errors[0].error.message).toBe('Bad record');
    expect(result.partialTail).toBeNull();
  });

  it('handles decode errors with partial tail', () => {
    const failingCodec: Codec<string> = {
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'bad') throw new Error('Bad record');
        return s;
      },
    };

    const content = 'good\nbad\npartial';
    const result = recoverFromContent(content, failingCodec.decode);

    expect(result.records).toEqual(['good']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].lineNo).toBe(2);
    expect(result.partialTail).toBe('partial');
  });
});

describe('WriteAheadLogFile', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should create instance with file path and codecs without opening', () => {
    const w = wal('/test/a.log');
    expect(w).toBeInstanceOf(WriteAheadLogFile);
    expect(w.getPath()).toBe('/test/a.log');
    expect(w.isClosed()).toBe(true);
  });

  it('throws error when appending without opening', () => {
    const w = wal('/test/a.log');
    expect(w.isClosed()).toBe(true);
    expect(() => w.append('a')).toThrow('WAL not opened');
  });

  it('opens and closes correctly', () => {
    const w = wal('/test/a.log');
    expect(w.isClosed()).toBe(true);
    w.open();
    expect(w.isClosed()).toBe(false);
    w.close();
    expect(w.isClosed()).toBe(true);
  });

  it('multiple open calls are idempotent', () => {
    const w = wal('/test/a.log');
    expect(w.isClosed()).toBe(true);

    w.open();
    expect(w.isClosed()).toBe(false);

    w.open();
    expect(w.isClosed()).toBe(false);
    w.open();
    expect(w.isClosed()).toBe(false);

    w.close();
    expect(w.isClosed()).toBe(true);
  });

  it('append lines if opened', () => {
    vol.mkdirSync('/test', { recursive: true });
    const w = wal('/test/a.log');
    w.open();
    w.append('a');
    w.append('b');

    expect(read('/test/a.log')).toBe('a\nb\n');
  });

  it('appends records with encode logic', () => {
    const w = wal('/test/a.log');
    w.open();

    w.append('any string');
    expect(read('/test/a.log')).toBe('any string\n');
  });

  it('returns empty result when file does not exist', () => {
    const w = wal('/test/nonexistent.log');
    const result = w.recover();

    expect(result).toEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });

  it('can recover without opening (reads file directly)', () => {
    vol.mkdirSync('/test', { recursive: true });
    write('/test/a.log', 'line1\nline2\n');
    const w = wal('/test/a.log');

    const result = w.recover();
    expect(result.records).toEqual(['line1', 'line2']);
    expect(result.errors).toEqual([]);
  });

  it('recovers valid records if opened', () => {
    vol.mkdirSync('/test', { recursive: true });
    write('/test/a.log', 'line1\nline2\n');
    const w = wal('/test/a.log');
    w.open();
    expect(w.recover()).toStrictEqual({
      records: ['line1', 'line2'],
      errors: [],
      partialTail: null,
    });
  });

  it('recovers with decode errors and partial tail using tolerant codec', () => {
    vol.mkdirSync('/test', { recursive: true });
    write('/test/a.log', 'ok\nbad\npartial');

    const tolerantCodec = createTolerantCodec({
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'bad') throw new Error('Bad record');
        return s;
      },
    });

    expect(wal('/test/a.log', tolerantCodec).recover()).toStrictEqual({
      records: ['ok', { __invalid: true, raw: 'bad' }],
      errors: [],
      partialTail: 'partial',
    });
  });

  it('repacks clean file without errors', () => {
    vol.mkdirSync('/test', { recursive: true });
    write('/test/a.log', 'a\nb\n');
    wal('/test/a.log').repack();
    expect(read('/test/a.log')).toBe('a\nb\n');
  });

  it('repacks with decode errors using tolerant codec', () => {
    vol.mkdirSync('/test', { recursive: true });
    write('/test/a.log', 'ok\nbad\n');

    const tolerantCodec = createTolerantCodec({
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'bad') throw new Error('Bad record');
        return s;
      },
    });

    wal('/test/a.log', tolerantCodec).repack();
    expect(read('/test/a.log')).toBe('ok\nbad\n');
  });

  it('logs decode errors during content recovery', () => {
    const failingCodec: Codec<string> = {
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'bad') throw new Error('Bad record during recovery');
        return s;
      },
    };

    const content = 'good\nbad\ngood\n';
    const result = recoverFromContent(content, failingCodec.decode);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error.message).toBe('Bad record during recovery');
    expect(result.records).toEqual(['good', 'good']);
  });
});

describe('stringCodec', () => {
  it('should encode strings as-is', () => {
    const codec = stringCodec<string>();
    expect(codec.encode('hello')).toBe('hello');
    expect(codec.encode('')).toBe('');
    expect(codec.encode('with spaces')).toBe('with spaces');
  });

  it('should encode objects as JSON strings', () => {
    const codec = stringCodec<object>();
    const obj = { name: 'test', value: 42 };
    expect(codec.encode(obj)).toBe('{"name":"test","value":42}');
  });

  it('should encode mixed types correctly', () => {
    const codec = stringCodec<string | object>();
    expect(codec.encode('string value')).toBe('string value');
    expect(codec.encode({ key: 'value' })).toBe('{"key":"value"}');
    expect(codec.encode([1, 2, 3])).toBe('[1,2,3]');
  });

  it('should decode valid JSON strings', () => {
    const codec = stringCodec<object>();
    const jsonString = '{"name":"test","value":42}';
    const result = codec.decode(jsonString);
    expect(result).toEqual({ name: 'test', value: 42 });
  });

  it('should decode arrays from JSON strings', () => {
    const codec = stringCodec<any[]>();
    const jsonString = '[1,2,3]';
    const result = codec.decode(jsonString);
    expect(result).toEqual([1, 2, 3]);
  });

  it('should return strings as-is when JSON parsing fails', () => {
    const codec = stringCodec<string>();
    expect(codec.decode('not json')).toBe('not json');
    expect(codec.decode('hello world')).toBe('hello world');
    expect(codec.decode('')).toBe('');
  });

  it('should handle malformed JSON gracefully', () => {
    const codec = stringCodec<string>();
    expect(codec.decode('{invalid')).toBe('{invalid');
    expect(codec.decode('[1,2,')).toBe('[1,2,');
    expect(codec.decode('null')).toBe(null);
  });

  it('should round-trip strings correctly', () => {
    const codec = stringCodec<string>();
    const original = 'hello world';
    const encoded = codec.encode(original);
    const decoded = codec.decode(encoded);
    expect(decoded).toBe(original);
  });

  it('should round-trip objects correctly', () => {
    const codec = stringCodec<object>();
    const original = { name: 'test', nested: { value: 123 } };
    const encoded = codec.encode(original);
    const decoded = codec.decode(encoded);
    expect(decoded).toEqual(original);
  });

  it('should round-trip arrays correctly', () => {
    const codec = stringCodec<any[]>();
    const original = [1, 'two', { three: 3 }];
    const encoded = codec.encode(original);
    const decoded = codec.decode(encoded);
    expect(decoded).toEqual(original);
  });

  it('should maintain type safety with generics', () => {
    const stringCodecInstance = stringCodec<string>();
    const str: string = stringCodecInstance.decode('test');
    expect(typeof str).toBe('string');

    const objectCodecInstance = stringCodec<{ id: number; name: string }>();
    const obj = objectCodecInstance.decode('{"id":1,"name":"test"}');
    expect(obj).toEqual({ id: 1, name: 'test' });

    const unionCodecInstance = stringCodec<string | number[]>();
    expect(unionCodecInstance.decode('string')).toBe('string');
    expect(unionCodecInstance.decode('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('should handle special JSON values', () => {
    const codec = stringCodec<any>();
    expect(codec.decode('null')).toBe(null);
    expect(codec.decode('true')).toBe(true);
    expect(codec.decode('false')).toBe(false);
    expect(codec.decode('"quoted string"')).toBe('quoted string');
    expect(codec.decode('42')).toBe(42);
  });
});

describe('getShardId', () => {
  it('should generate shard ID with PID and default TID', () => {
    const pid = 12345;
    const result = getShardId(pid);

    expect(result).toBe('12345-0');
  });

  it('should generate shard ID with PID and custom TID', () => {
    const pid = 12345;
    const tid = 678;
    const result = getShardId(pid, tid);

    expect(result).toBe('12345-678');
  });

  it('should handle zero PID', () => {
    const result = getShardId(0, 5);

    expect(result).toBe('0-5');
  });

  it('should handle zero TID', () => {
    const result = getShardId(123, 0);

    expect(result).toBe('123-0');
  });

  it('should handle large numbers', () => {
    const pid = 999999;
    const tid = 123456;
    const result = getShardId(pid, tid);

    expect(result).toBe('999999-123456');
  });

  it('should handle negative numbers', () => {
    const result = getShardId(-1, -2);

    expect(result).toBe('-1--2');
  });

  it('should be idempotent for same inputs', () => {
    const pid = 42;
    const tid = 7;

    const result1 = getShardId(pid, tid);
    const result2 = getShardId(pid, tid);

    expect(result1).toBe(result2);
    expect(result1).toBe('42-7');
  });
});

describe('getShardedGroupId', () => {
  const originalTimeOrigin = performance.timeOrigin;

  afterEach(() => {
    Object.defineProperty(performance, 'timeOrigin', {
      value: originalTimeOrigin,
      writable: true,
    });
  });

  it('should generate group ID from floored timeOrigin', () => {
    const mockTimeOrigin = 1234567890.123;
    Object.defineProperty(performance, 'timeOrigin', {
      value: mockTimeOrigin,
      writable: true,
    });

    const result = getShardedGroupId();

    expect(result).toBe('1234567890');
  });

  it('should handle zero timeOrigin', () => {
    Object.defineProperty(performance, 'timeOrigin', {
      value: 0,
      writable: true,
    });

    const result = getShardedGroupId();

    expect(result).toBe('0');
  });

  it('should handle decimal timeOrigin', () => {
    Object.defineProperty(performance, 'timeOrigin', {
      value: 123.999,
      writable: true,
    });

    const result = getShardedGroupId();

    expect(result).toBe('123');
  });

  it('should handle large timeOrigin values', () => {
    const largeTimeOrigin = 9999999999999.999;
    Object.defineProperty(performance, 'timeOrigin', {
      value: largeTimeOrigin,
      writable: true,
    });

    const result = getShardedGroupId();

    expect(result).toBe('9999999999999');
  });

  it('should be idempotent within same process', () => {
    const mockTimeOrigin = 987654321.456;
    Object.defineProperty(performance, 'timeOrigin', {
      value: mockTimeOrigin,
      writable: true,
    });

    const result1 = getShardedGroupId();
    const result2 = getShardedGroupId();

    expect(result1).toBe(result2);
    expect(result1).toBe('987654321');
  });

  it('should handle negative timeOrigin', () => {
    Object.defineProperty(performance, 'timeOrigin', {
      value: -123.456,
      writable: true,
    });

    const result = getShardedGroupId();

    expect(result).toBe('-124');
  });
});
