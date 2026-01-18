import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  type Codec,
  ShardedWal,
  WAL_ID_PATTERNS,
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

  it('should act as WLA for any kind of data', () => {
    const w = wal('/test/a.log', stringCodec<object>());
    w.open();
    w.append({ id: 1, name: 'test' });
    w.close();
    expect(w.recover().records).toStrictEqual([{ id: 1, name: 'test' }]);
    w.open();
    expect(() =>
      w.append('{ id: 1, name:...' as unknown as object),
    ).not.toThrow();
    w.close();
    expect(w.recover().records).toStrictEqual([
      { id: 1, name: 'test' },
      '{ id: 1, name:...',
    ]);
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
    expect(result.records).toStrictEqual(['line1', 'line2']);
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
  it('should generate shard ID with readable timestamp', () => {
    const result = getShardId();

    expect(result).toMatch(WAL_ID_PATTERNS.SHARD_ID);
    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should generate different shard IDs for different calls', () => {
    const result1 = getShardId();
    const result2 = getShardId();

    expect(result1).not.toBe(result2);
    expect(result1).toStartWith('20231114-221320-000.');
    expect(result2).toStartWith('20231114-221320-000.');
  });

  it('should handle zero values', () => {
    const result = getShardId();
    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should handle negative timestamps', () => {
    const result = getShardId();

    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should handle large timestamps', () => {
    const result = getShardId();

    expect(result).toStartWith('20231114-221320-000.');
  });

  it('should generate incrementing counter', () => {
    const result1 = getShardId();
    const result2 = getShardId();

    const parts1 = result1.split('.');
    const parts2 = result2.split('.');
    const counter1 = parts1.at(-1) as string;
    const counter2 = parts2.at(-1) as string;

    expect(Number.parseInt(counter1, 10)).toBe(
      Number.parseInt(counter2, 10) - 1,
    );
  });
});

describe('getShardedGroupId', () => {
  it('should work with mocked timeOrigin', () => {
    const result = getShardedGroupId();

    expect(result).toBe('20231114-221320-000');
    expect(result).toMatch(WAL_ID_PATTERNS.GROUP_ID);
  });

  it('should be idempotent within same process', () => {
    const result1 = getShardedGroupId();
    const result2 = getShardedGroupId();

    expect(result1).toBe(result2);
  });
});

describe('parseWalFormat', () => {
  it('should apply all defaults when given empty config', () => {
    const result = parseWalFormat({});

    expect(result.baseName).toBe('trace');
    expect(result.walExtension).toBe('.log');
    expect(result.finalExtension).toBe('.log');
    expect(result.codec).toBeDefined();
    expect(typeof result.finalizer).toBe('function');
  });

  it('should use provided baseName and default others', () => {
    const result = parseWalFormat({ baseName: 'test' });

    expect(result.baseName).toBe('test');
    expect(result.walExtension).toBe('.log');
    expect(result.finalExtension).toBe('.log');
  });

  it('should use provided walExtension and default finalExtension to match', () => {
    const result = parseWalFormat({ walExtension: '.wal' });

    expect(result.walExtension).toBe('.wal');
    expect(result.finalExtension).toBe('.wal');
  });

  it('should use provided finalExtension independently', () => {
    const result = parseWalFormat({
      walExtension: '.wal',
      finalExtension: '.json',
    });

    expect(result.walExtension).toBe('.wal');
    expect(result.finalExtension).toBe('.json');
  });

  it('should use provided codec', () => {
    const customCodec = stringCodec<string>();
    const result = parseWalFormat({ codec: customCodec });

    expect(result.codec).toBe(customCodec);
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
      finalizer: (records: any[]) => JSON.stringify(records),
    };

    const result = parseWalFormat(config);

    expect(result.baseName).toBe('my-wal');
    expect(result.walExtension).toBe('.wal');
    expect(result.finalExtension).toBe('.json');
    expect(result.codec).toBe(config.codec);
    expect(result.finalizer(['test'])).toBe('["test"]');
  });

  it('should use default finalizer when none provided', () => {
    const result = parseWalFormat<string>({ baseName: 'test' });
    expect(result.finalizer(['line1', 'line2'])).toBe('line1\nline2\n');
    expect(result.finalizer([])).toBe('\n');
  });
});

describe('isLeaderWal', () => {
  it('should return true when env var matches current pid', () => {
    const profilerId = `${Math.round(performance.timeOrigin)}${process.pid}.1.0`;
    vi.stubEnv('TEST_LEADER_PID', profilerId);

    const result = isLeaderWal('TEST_LEADER_PID', profilerId);
    expect(result).toBe(true);
  });

  it('should return false when env var does not match current profilerId', () => {
    const wrongProfilerId = `${Math.round(performance.timeOrigin)}${process.pid}.2.0`;
    vi.stubEnv('TEST_LEADER_PID', wrongProfilerId);

    const currentProfilerId = `${Math.round(performance.timeOrigin)}${process.pid}.1.0`;
    const result = isLeaderWal('TEST_LEADER_PID', currentProfilerId);
    expect(result).toBe(false);
  });

  it('should return false when env var is not set', () => {
    vi.stubEnv('NON_EXISTENT_VAR', undefined as any);

    const profilerId = `${Math.round(performance.timeOrigin)}${process.pid}.1.0`;
    const result = isLeaderWal('NON_EXISTENT_VAR', profilerId);
    expect(result).toBe(false);
  });

  it('should return false when env var is empty string', () => {
    vi.stubEnv('TEST_LEADER_PID', '');

    const profilerId = `${Math.round(performance.timeOrigin)}${process.pid}.1.0`;
    const result = isLeaderWal('TEST_LEADER_PID', profilerId);
    expect(result).toBe(false);
  });
});

describe('setLeaderWal', () => {
  beforeEach(() => {
    // Clean up any existing TEST_ORIGIN_PID
    // eslint-disable-next-line functional/immutable-data
    delete process.env['TEST_ORIGIN_PID'];
  });

  it('should set env var when not already set', () => {
    expect(process.env['TEST_ORIGIN_PID']).toBeUndefined();

    const profilerId = `${Math.round(performance.timeOrigin)}${process.pid}.1.0`;
    setLeaderWal('TEST_ORIGIN_PID', profilerId);

    expect(process.env['TEST_ORIGIN_PID']).toBe(profilerId);
  });

  it('should not overwrite existing env var', () => {
    const existingProfilerId = `${Math.round(performance.timeOrigin)}${process.pid}.1.0`;
    const newProfilerId = `${Math.round(performance.timeOrigin)}${process.pid}.2.0`;

    vi.stubEnv('TEST_ORIGIN_PID', existingProfilerId);
    setLeaderWal('TEST_ORIGIN_PID', newProfilerId);

    expect(process.env['TEST_ORIGIN_PID']).toBe(existingProfilerId);
  });

  it('should set env var to profiler id', () => {
    const profilerId = `${Math.round(performance.timeOrigin)}${process.pid}.1.0`;
    setLeaderWal('TEST_ORIGIN_PID', profilerId);

    expect(process.env['TEST_ORIGIN_PID']).toBe(profilerId);
  });
});

describe('ShardedWal', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should create instance with directory and format', () => {
    const sw = new ShardedWal({
      dir: '/test/shards',
      format: {
        baseName: 'test-wal',
      },
    });

    expect(sw).toBeInstanceOf(ShardedWal);
  });

  it('should create shard with correct file path', () => {
    const sw = new ShardedWal({
      dir: '/test/shards',
      format: {
        baseName: 'trace',
        walExtension: '.log',
      },
    });

    const shard = sw.shard('20231114-221320-000.1.2.3');
    expect(shard).toBeInstanceOf(WriteAheadLogFile);
    expect(shard.getPath()).toBe(
      '/test/shards/20231114-221320-000/trace.20231114-221320-000.1.2.3.log',
    );
  });

  it('should create shard with default shardId when no argument provided', () => {
    const sw = new ShardedWal({
      dir: '/test/shards',
      format: {
        baseName: 'trace',
        walExtension: '.log',
      },
    });

    const shard = sw.shard();
    expect(shard.getPath()).toStartWithPath(
      '/test/shards/20231114-221320-000/trace.20231114-221320-000.10001',
    );
    expect(shard.getPath()).toEndWithPath('.log');
  });

  it('should list no shard files when directory does not exist', () => {
    const sw = new ShardedWal({
      dir: '/nonexistent',
      format: {
        baseName: 'test-wal',
      },
    });
    const files = (sw as any).shardFiles();
    expect(files).toEqual([]);
  });

  it('should list no shard files when directory is empty', () => {
    const sw = new ShardedWal({
      dir: '/empty',
      format: {
        baseName: 'test-wal',
      },
    });
    // Create the group directory (matches actual getShardedGroupId() output)
    vol.mkdirSync('/empty/20231114-221320-000', { recursive: true });
    const files = (sw as any).shardFiles();
    expect(files).toEqual([]);
  });

  it('should list shard files matching extension', () => {
    // Note: Real shard IDs look like "1704067200000.12345.1.1" (timestamp.pid.threadId.count)
    // These test IDs use simplified format "001.1", "002.2" for predictability
    vol.fromJSON({
      '/shards/20231114-221320-000/trace.19700101-000820-001.1.log': 'content1',
      '/shards/20231114-221320-000/trace.19700101-000820-002.2.log': 'content2',
      '/shards/other.txt': 'not a shard',
    });

    const sw = new ShardedWal({
      dir: '/shards',
      format: {
        baseName: 'trace',
        walExtension: '.log',
      },
    });
    const files = (sw as any).shardFiles();

    expect(files).toHaveLength(2);
    expect(files).toEqual(
      expect.arrayContaining([
        expect.pathToMatch(
          '/shards/20231114-221320-000/trace.19700101-000820-001.1.log',
        ),
        expect.pathToMatch(
          '/shards/20231114-221320-000/trace.19700101-000820-002.2.log',
        ),
      ]),
    );
  });

  it('should finalize empty shards to empty result', () => {
    const sw = new ShardedWal({
      dir: '/shards',
      format: {
        baseName: 'final',
        finalExtension: '.json',
        finalizer: records => `${JSON.stringify(records)}\n`,
      },
    });

    // Create the group directory
    vol.mkdirSync('/shards/20231114-221320-000', { recursive: true });
    sw.finalize();

    expect(
      read('/shards/20231114-221320-000/final.20231114-221320-000.json'),
    ).toBe('[]\n');
  });

  it('should finalize multiple shards into single file', () => {
    vol.fromJSON({
      '/shards/20231114-221320-000/merged.20240101-120000-001.1.log':
        'record1\n',
      '/shards/20231114-221320-000/merged.20240101-120000-002.2.log':
        'record2\n',
    });

    const sw = new ShardedWal({
      dir: '/shards',
      format: {
        baseName: 'merged',
        walExtension: '.log',
        finalExtension: '.json',
        finalizer: records => `${JSON.stringify(records)}\n`,
      },
    });

    sw.finalize();

    const result = JSON.parse(
      read(
        '/shards/20231114-221320-000/merged.20231114-221320-000.json',
      ).trim(),
    );
    expect(result).toEqual(['record1', 'record2']);
  });

  it('should handle invalid entries during finalize', () => {
    vol.fromJSON({
      '/shards/20231114-221320-000/final.20240101-120000-001.1.log': 'valid\n',
      '/shards/20231114-221320-000/final.20240101-120000-002.2.log':
        'invalid\n',
    });
    const tolerantCodec = createTolerantCodec({
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'invalid') throw new Error('Bad record');
        return s;
      },
    });

    const sw = new ShardedWal({
      dir: '/shards',
      format: {
        baseName: 'final',
        walExtension: '.log',
        finalExtension: '.json',
        codec: tolerantCodec,
        finalizer: records => `${JSON.stringify(records)}\n`,
      },
    });

    sw.finalize();

    const result = JSON.parse(
      read('/shards/20231114-221320-000/final.20231114-221320-000.json').trim(),
    );
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('valid');
    expect(result[1]).toEqual({ __invalid: true, raw: 'invalid' });
  });

  it('should cleanup shard files', () => {
    vol.fromJSON({
      '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
        'content1',
      '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.2.log':
        'content2',
    });
    const sw = new ShardedWal({
      dir: '/shards',
      format: {
        baseName: 'test',
        walExtension: '.log',
      },
    });

    expect(vol.toJSON()).toStrictEqual({
      '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
        'content1',
      '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.2.log':
        'content2',
    });

    sw.cleanup();

    expect(vol.toJSON()).toStrictEqual({});
  });

  it('should handle cleanup when some shard files do not exist', () => {
    vol.fromJSON({
      '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log':
        'content1',
    });

    const sw = new ShardedWal({
      dir: '/shards',
      format: {
        baseName: 'test',
        walExtension: '.log',
      },
    });

    vol.unlinkSync(
      '/shards/20231114-221320-000/test.20231114-221320-000.10001.2.1.log',
    );
    expect(() => sw.cleanup()).not.toThrow();
  });

  it('should use custom options in finalizer', () => {
    vol.fromJSON({
      '/shards/20231114-221320-000/final.20231114-221320-000.10001.2.1.log':
        'record1\n',
    });

    const sw = new ShardedWal({
      dir: '/shards',
      format: {
        baseName: 'final',
        walExtension: '.log',
        finalExtension: '.json',
        finalizer: (records, opt) =>
          `${JSON.stringify({ records, meta: opt })}\n`,
      },
    });

    sw.finalize({ version: '1.0', compressed: true });

    const result = JSON.parse(
      read('/shards/20231114-221320-000/final.20231114-221320-000.json'),
    );
    expect(result.records).toEqual(['record1']);
    expect(result.meta).toEqual({ version: '1.0', compressed: true });
  });
});
