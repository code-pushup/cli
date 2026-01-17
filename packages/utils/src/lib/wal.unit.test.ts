import { vol } from 'memfs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  type Codec,
  ShardedWal,
  WriteAheadLogFile,
  createTolerantCodec,
  filterValidRecords,
  recoverFromContent,
} from './wal.js';

/* -------------------------------- helpers -------------------------------- */

const read = (p: string) => vol.readFileSync(p, 'utf8');
const write = (p: string, c: string) => vol.writeFileSync(p, c);

const stringCodec: Codec<string> = { encode: v => v, decode: v => v };

const wal = <T>(file: string, codec: Codec<T>) =>
  new WriteAheadLogFile({ file, codec });

/* --------------------------- WriteAheadLogFile ---------------------------- */

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
    // Encode still throws as it's not made tolerant
    expect(() => c.encode(42)).toThrow('encoding error');
    // But decode returns an InvalidEntry instead of throwing
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
    // Invalid decode should return InvalidEntry, and encoding that should return the raw value
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
    const result = recoverFromContent(content, stringCodec.decode);
    expect(result).toEqual({
      records: ['a', 'b'],
      errors: [],
      partialTail: null,
    });
  });

  it('handles empty content', () => {
    const content = '';
    const result = recoverFromContent(content, stringCodec.decode);
    expect(result).toEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });

  it('handles content without trailing newline', () => {
    const content = 'a\nb';
    const result = recoverFromContent(content, stringCodec.decode);
    expect(result).toEqual({
      records: ['a'],
      errors: [],
      partialTail: 'b',
    });
  });

  it('skips empty lines', () => {
    const content = 'a\n\nb\n';
    const result = recoverFromContent(content, stringCodec.decode);
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
    const w = wal('/test/a.log', stringCodec);
    expect(w).toBeInstanceOf(WriteAheadLogFile);
    expect(w.path).toBe('/test/a.log');
    expect(w.isClosed()).toBe(true);
  });

  it('throws error when appending without opening', () => {
    const w = wal('/test/a.log', stringCodec);
    expect(w.isClosed()).toBe(true);
    expect(() => w.append('a')).toThrow('WAL not opened');
  });

  it('opens and closes correctly', () => {
    const w = wal('/test/a.log', stringCodec);
    expect(w.isClosed()).toBe(true);
    w.open();
    expect(w.isClosed()).toBe(false);
    w.close();
    expect(w.isClosed()).toBe(true);
  });

  it('append lines if opened', () => {
    vol.mkdirSync('/test', { recursive: true });
    const w = wal('/test/a.log', stringCodec);
    w.open();
    w.append('a');
    w.append('b');

    expect(read('/test/a.log')).toBe('a\nb\n');
  });

  it('appends records with encode logic', () => {
    const w = wal('/test/a.log', stringCodec);
    w.open();

    w.append('any string');
    expect(read('/test/a.log')).toBe('any string\n');
  });

  it('can recover without opening (reads file directly)', () => {
    vol.mkdirSync('/test', { recursive: true });
    write('/test/a.log', 'line1\nline2\n');
    const w = wal('/test/a.log', stringCodec);
    // Profiler WAL can recover without opening - it reads the file directly
    const result = w.recover();
    expect(result.records).toEqual(['line1', 'line2']);
    expect(result.errors).toEqual([]);
  });

  it('recovers valid records if opened', () => {
    vol.mkdirSync('/test', { recursive: true });
    write('/test/a.log', 'line1\nline2\n');
    const w = wal('/test/a.log', stringCodec);
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
    wal('/test/a.log', stringCodec).repack();
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

    // With tolerant codec, repack should succeed and preserve all entries (valid and invalid)
    wal('/test/a.log', tolerantCodec).repack();
    expect(read('/test/a.log')).toBe('ok\nbad\n');
  });
});

/* ------------------------------- ShardedWal ------------------------------- */

describe('ShardedWal', () => {
  beforeEach(() => {
    vol.reset();
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  const sharded = () =>
    new ShardedWal('/test/shards', {
      baseName: 'test',
      walExtension: '.jsonl',
      finalExtension: '.merged',
      codec: stringCodec,
      shardPath: (id: string) => `test.${id}.jsonl`,
      finalPath: () => 'test.merged',
      finalizer: (records: string[]) => `${records.join('\n')}\n`,
    });

  it('merges shards and cleans up', () => {
    vol.mkdirSync('/test/shards', { recursive: true });
    const s = sharded();
    const w1 = s.shard('1');
    w1.open();
    w1.append('r1');
    w1.close();
    const w2 = s.shard('2');
    w2.open();
    w2.append('r2');
    w2.close();

    s.finalize();
    expect(read('/test/shards/test.merged')).toBe('r1\nr2\n');

    s.cleanup();
    expect(vol.readdirSync('/test/shards')).toEqual(['test.merged']);
  });

  it('handles decode errors with tolerant codec during finalize', () => {
    vol.mkdirSync('/test/shards', { recursive: true });
    write('/test/shards/test.w1.jsonl', '{"id":1}\nbad\n');

    const tolerantJsonCodec = createTolerantCodec(JSON.stringify, JSON.parse);

    const s = new ShardedWal('/test/shards', {
      baseName: 'test',
      walExtension: '.jsonl',
      finalExtension: '.merged',
      codec: tolerantJsonCodec,
      shardPath: (id: string) => `test.${id}.jsonl`,
      finalPath: () => 'test.merged',
      finalizer: (records: any[]) =>
        `${records.map(r => tolerantJsonCodec.encode(r)).join('\n')}\n`,
    });
    s.finalize();

    // Should contain all entries - valid ones and invalid ones preserved as raw data
    expect(read('/test/shards/test.merged')).toBe('{"id":1}\nbad\n');
  });

  it('ignores non-matching files', () => {
    vol.fromJSON({
      '/test/shards/test.a.jsonl': 'x',
      '/test/shards/other.log': 'y',
    });

    sharded().cleanup();
    expect(vol.existsSync('/test/shards/other.log')).toBe(true);
  });
});
