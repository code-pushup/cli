import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const read = (p: string) => vol.readFileSync(p, 'utf8') as string;
const write = (p: string, c: string) => vol.writeFileSync(p, c);

const wal = <T extends object | string>(
  file: string,
  codec: Codec<T> = stringCodec<T>(),
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
    const result = recoverFromContent(content, stringCodec().decode);
    expect(result).toEqual({
      records: ['a', 'b'],
      errors: [],
      partialTail: null,
    });
  });

  it('handles empty content', () => {
    const content = '';
    const result = recoverFromContent(content, stringCodec().decode);
    expect(result).toEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });

  it('handles content without trailing newline', () => {
    const content = 'a\nb';
    const result = recoverFromContent(content, stringCodec().decode);
    expect(result).toEqual({
      records: ['a'],
      errors: [],
      partialTail: 'b',
    });
  });

  it('skips empty lines', () => {
    const content = 'a\n\nb\n';
    const result = recoverFromContent(content, stringCodec().decode);
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
    expect(result.errors.at(0)?.error.message).toBe('Bad record');
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
    expect(result.errors.at(0)?.lineNo).toBe(2);
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
    expect(result.errors.at(0)?.error.message).toBe(
      'Bad record during recovery',
    );
    expect(result.records).toEqual(['good', 'good']);
  });

  it('repacks with invalid entries and logs warning', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

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

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Found invalid entries during WAL repack',
    );
    expect(read('/test/a.log')).toBe('ok\nbad\n');

    consoleLogSpy.mockRestore();
  });

  it('recoverFromContent handles decode errors and returns them', () => {
    const failingCodec: Codec<string> = {
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'bad') throw new Error('Bad record during recovery');
        return s;
      },
    };

    const content = 'good\nbad\ngood\n';
    const result = recoverFromContent(content, failingCodec.decode);

    expect(result.records).toEqual(['good', 'good']);
    expect(result.errors).toHaveLength(1);
    expect(result).toHaveProperty(
      'errors',
      expect.arrayContaining([
        {
          lineNo: 2,
          line: 'bad',
          error: expect.any(Error),
        },
      ]),
    );
  });

  it('repack logs decode errors when recover returns errors', () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    vol.mkdirSync('/test', { recursive: true });
    write('/test/a.log', 'content\n');

    const walInstance = wal('/test/a.log');

    // Mock the recover method to return errors
    const recoverSpy = vi.spyOn(walInstance, 'recover').mockReturnValue({
      records: ['content'],
      errors: [
        { lineNo: 1, line: 'content', error: new Error('Mock decode error') },
      ],
      partialTail: null,
    });

    walInstance.repack();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'WAL repack encountered decode errors',
    );

    recoverSpy.mockRestore();
    consoleLogSpy.mockRestore();
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
    expect(codec.decode('null')).toBeNull();
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
    expect(codec.decode('null')).toBeNull();
    expect(codec.decode('true')).toBe(true);
    expect(codec.decode('false')).toBe(false);
    expect(codec.decode('"quoted string"')).toBe('quoted string');
    expect(codec.decode('42')).toBe(42);
  });
});

describe('getShardId', () => {
  it('should generate shard ID with PID and default TID', () => {
    const pid = 12_345;
    const result = getShardId(pid);

    expect(result).toBe('12345-0');
  });

  it('should generate shard ID with PID and custom TID', () => {
    const pid = 12_345;
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
    const pid = 999_999;
    const tid = 123_456;
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
  it('should generate group ID from floored timeOrigin', () => {
    const result = getShardedGroupId();

    expect(result).toBe('500000');
  });

  it('should work with mocked timeOrigin', () => {
    const result = getShardedGroupId();

    expect(result).toBe('500000');
  });

  it('should handle decimal timeOrigin', () => {
    const result = getShardedGroupId();

    expect(result).toBe('500000');
  });

  it('should handle timeOrigin values', () => {
    const result = getShardedGroupId();

    expect(result).toBe('500000');
  });

  it('should be idempotent within same process', () => {
    const result1 = getShardedGroupId();
    const result2 = getShardedGroupId();

    expect(result1).toBe(result2);
    expect(result1).toBe('500000');
  });
});

describe('parseWalFormat', () => {
  it('should apply all defaults when given empty config', () => {
    const result = parseWalFormat({});

    expect(result.baseName).toMatch(/^\d+$/);
    expect(result.walExtension).toBe('.log');
    expect(result.finalExtension).toBe('.log');
    expect(result.codec).toBeDefined();
    expect(typeof result.shardPath).toBe('function');
    expect(typeof result.finalPath).toBe('function');
    expect(typeof result.finalizer).toBe('function');
  });

  it('should use provided baseName and default others', () => {
    const result = parseWalFormat({ baseName: 'test' });

    expect(result.baseName).toBe('test');
    expect(result.walExtension).toBe('.log');
    expect(result.finalExtension).toBe('.log');
    expect(result.shardPath('123')).toBe('test.123.log');
    expect(result.finalPath()).toBe('test.log');
  });

  it('should use provided walExtension and default finalExtension to match', () => {
    const result = parseWalFormat({ walExtension: '.wal' });

    expect(result.walExtension).toBe('.wal');
    expect(result.finalExtension).toBe('.wal');
    expect(result.shardPath('123')).toMatch(/\.123\.wal$/);
    expect(result.finalPath()).toMatch(/\.wal$/);
  });

  it('should use provided finalExtension independently', () => {
    const result = parseWalFormat({
      walExtension: '.wal',
      finalExtension: '.json',
    });

    expect(result.walExtension).toBe('.wal');
    expect(result.finalExtension).toBe('.json');
    expect(result.shardPath('123')).toMatch(/\.123\.wal$/);
    expect(result.finalPath()).toMatch(/\.json$/);
  });

  it('should use provided codec', () => {
    const customCodec = stringCodec<string>();
    const result = parseWalFormat({ codec: customCodec });

    expect(result.codec).toBe(customCodec);
  });

  it('should use custom shardPath function', () => {
    const customShardPath = (id: string) => `shard-${id}.log`;
    const result = parseWalFormat({ shardPath: customShardPath });

    expect(result.shardPath('test')).toBe('shard-test.log');
  });

  it('should use custom finalPath function', () => {
    const customFinalPath = () => 'final-output.log';
    const result = parseWalFormat({ finalPath: customFinalPath });

    expect(result.finalPath()).toBe('final-output.log');
  });

  it('should use custom finalizer function', () => {
    const customFinalizer = (records: any[]) => `custom: ${records.length}`;
    const result = parseWalFormat({ finalizer: customFinalizer });

    expect(result.finalizer(['a', 'b'])).toBe('custom: 2');
  });

  it('should work with all custom parameters', () => {
    const config = {
      baseName: 'my-wal',
      walExtension: '.wal',
      finalExtension: '.json',
      codec: stringCodec<string>(),
      shardPath: (id: string) => `shards/${id}.wal`,
      finalPath: () => 'output/final.json',
      finalizer: (records: any[]) => JSON.stringify(records),
    };

    const result = parseWalFormat(config);

    expect(result.baseName).toBe('my-wal');
    expect(result.walExtension).toBe('.wal');
    expect(result.finalExtension).toBe('.json');
    expect(result.codec).toBe(config.codec);
    expect(result.shardPath('123')).toBe('shards/123.wal');
    expect(result.finalPath()).toBe('output/final.json');
    expect(result.finalizer(['test'])).toBe('["test"]');
  });

  it('should use default finalizer when none provided', () => {
    const result = parseWalFormat({ baseName: 'test' });
    expect(result.finalizer(['line1', 'line2'])).toBe('line1\nline2\n');
    expect(result.finalizer([])).toBe('\n');
  });
});

describe('isLeaderWal', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv }; // eslint-disable-line functional/immutable-data
  });

  it('should return true when env var matches current pid', () => {
    const envVarName = 'TEST_LEADER_PID';
    process.env[envVarName] = '10001'; // eslint-disable-line functional/immutable-data

    const result = isLeaderWal(envVarName);
    expect(result).toBe(true);
  });

  it('should return false when env var does not match current pid', () => {
    const envVarName = 'TEST_LEADER_PID';
    process.env[envVarName] = '67890'; // eslint-disable-line functional/immutable-data

    const result = isLeaderWal(envVarName);
    expect(result).toBe(false);
  });

  it('should return false when env var is not set', () => {
    const envVarName = 'NON_EXISTENT_VAR';
    delete process.env[envVarName]; // eslint-disable-line @typescript-eslint/no-dynamic-delete,functional/immutable-data

    const result = isLeaderWal(envVarName);
    expect(result).toBe(false);
  });

  it('should return false when env var is empty string', () => {
    const envVarName = 'TEST_LEADER_PID';
    process.env[envVarName] = ''; // eslint-disable-line functional/immutable-data

    const result = isLeaderWal(envVarName);
    expect(result).toBe(false);
  });
});

describe('setLeaderWal', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv }; // eslint-disable-line functional/immutable-data
  });

  it('should set env var when not already set', () => {
    const envVarName = 'TEST_ORIGIN_PID';
    delete process.env[envVarName]; // eslint-disable-line @typescript-eslint/no-dynamic-delete,functional/immutable-data
    expect(process.env[envVarName]).toBeUndefined();

    setLeaderWal(envVarName);

    expect(process.env[envVarName]).toBe('10001'); // process.pid is mocked to 10001
  });

  it('should not overwrite existing env var', () => {
    const envVarName = 'TEST_ORIGIN_PID';
    const existingValue = '99999';

    process.env[envVarName] = existingValue; // eslint-disable-line functional/immutable-data
    setLeaderWal(envVarName);

    expect(process.env[envVarName]).toBe(existingValue);
  });

  it('should set env var to current pid as string', () => {
    const envVarName = 'TEST_ORIGIN_PID';
    delete process.env[envVarName]; // eslint-disable-line @typescript-eslint/no-dynamic-delete,functional/immutable-data
    setLeaderWal(envVarName);

    expect(process.env[envVarName]).toBe('10001');
  });
});

describe('ShardedWal', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should create instance with directory and format', () => {
    const sw = new ShardedWal('/test/shards', {});

    expect(sw).toBeInstanceOf(ShardedWal);
  });

  it('should create shard with correct file path', () => {
    const sw = new ShardedWal('/test/shards', {
      baseName: 'test-wal',
      walExtension: '.log',
    });

    const shard = sw.shard('123-456');
    expect(shard).toBeInstanceOf(WriteAheadLogFile);
    expect(shard.getPath()).toBe('/test/shards/test-wal.123-456.log');
  });

  it('should list no shard files when directory does not exist', () => {
    const sw = new ShardedWal('/nonexistent', {});
    // Access private method for testing
    const files = (sw as any).shardFiles();
    expect(files).toEqual([]);
  });

  it('should list no shard files when directory is empty', () => {
    vol.mkdirSync('/empty', { recursive: true });
    const sw = new ShardedWal('/empty', {});
    const files = (sw as any).shardFiles();
    expect(files).toEqual([]);
  });

  it('should list shard files matching extension', () => {
    vol.mkdirSync('/shards', { recursive: true });
    write('/shards/wal.1.log', 'content1');
    write('/shards/wal.2.log', 'content2');
    write('/shards/other.txt', 'not a shard');

    const sw = new ShardedWal('/shards', { walExtension: '.log' });
    const files = (sw as any).shardFiles();

    expect(files).toHaveLength(2);
    expect(files).toContain('/shards/wal.1.log');
    expect(files).toContain('/shards/wal.2.log');
  });

  it('should finalize empty shards to empty result', () => {
    vol.mkdirSync('/shards', { recursive: true });
    const sw = new ShardedWal('/shards', {
      baseName: 'test',
      finalPath: () => 'final.json',
      finalizer: records => `${JSON.stringify(records)}\n`,
    });

    sw.finalize();

    expect(read('/shards/final.json')).toBe('[]\n');
  });

  it('should finalize multiple shards into single file', () => {
    vol.mkdirSync('/shards', { recursive: true });
    write('/shards/test.1.log', 'record1\n');
    write('/shards/test.2.log', 'record2\n');

    const sw = new ShardedWal('/shards', {
      baseName: 'test',
      walExtension: '.log',
      finalPath: () => 'merged.json',
      finalizer: records => `${JSON.stringify(records)}\n`,
    });

    sw.finalize();

    const result = JSON.parse(read('/shards/merged.json').trim());
    expect(result).toEqual(['record1', 'record2']);
  });

  it('should handle invalid entries during finalize', () => {
    vol.mkdirSync('/shards', { recursive: true });
    write('/shards/test.1.log', 'valid\n');
    write('/shards/test.2.log', 'invalid\n');

    const tolerantCodec = createTolerantCodec({
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'invalid') throw new Error('Bad record');
        return s;
      },
    });

    const sw = new ShardedWal('/shards', {
      baseName: 'test',
      walExtension: '.log',
      codec: tolerantCodec,
      finalPath: () => 'final.json',
      finalizer: records => `${JSON.stringify(records)}\n`,
    });

    sw.finalize();

    const result = JSON.parse(read('/shards/final.json').trim());
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('valid');
    expect(result[1]).toEqual({ __invalid: true, raw: 'invalid' });
  });

  it('should cleanup shard files', () => {
    vol.mkdirSync('/shards', { recursive: true });
    write('/shards/test.1.log', 'content1');
    write('/shards/test.2.log', 'content2');

    const sw = new ShardedWal('/shards', {
      baseName: 'test',
      walExtension: '.log',
    });

    expect(vol.existsSync('/shards/test.1.log')).toBe(true);
    expect(vol.existsSync('/shards/test.2.log')).toBe(true);

    sw.cleanup();

    expect(vol.existsSync('/shards/test.1.log')).toBe(false);
    expect(vol.existsSync('/shards/test.2.log')).toBe(false);
  });

  it('should handle cleanup when some shard files do not exist', () => {
    vol.mkdirSync('/shards', { recursive: true });
    write('/shards/test.1.log', 'content1');

    const sw = new ShardedWal('/shards', {
      baseName: 'test',
      walExtension: '.log',
    });

    // Manually delete one file to simulate race condition
    vol.unlinkSync('/shards/test.1.log');

    // Should not throw
    expect(() => sw.cleanup()).not.toThrow();
  });

  it('should use custom options in finalizer', () => {
    vol.mkdirSync('/shards', { recursive: true });
    write('/shards/test.1.log', 'record1\n');

    const sw = new ShardedWal('/shards', {
      baseName: 'test',
      walExtension: '.log',
      finalPath: () => 'final.json',
      finalizer: (records, opt) =>
        `${JSON.stringify({ records, meta: opt })}\n`,
    });

    sw.finalize({ version: '1.0', compressed: true });

    const result = JSON.parse(read('/shards/final.json'));
    expect(result.records).toEqual(['record1']);
    expect(result.meta).toEqual({ version: '1.0', compressed: true });
  });
});
