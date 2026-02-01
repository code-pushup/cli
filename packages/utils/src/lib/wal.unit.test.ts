import { vol } from 'memfs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  type Codec,
  type InvalidEntry,
  WriteAheadLogFile,
  createTolerantCodec,
  filterValidRecords,
  parseWalFormat,
  recoverFromContent,
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
    expect(c.decode('42')).toEqual({ __invalid: true, raw: '42' });
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
    expect(filterValidRecords(records)).toEqual([
      { id: 1, name: 'valid1' },
      { id: 3, name: 'valid3' },
    ]);
  });
});

describe('recoverFromContent', () => {
  it('recovers valid records', () => {
    const result = recoverFromContent('a\nb\n', stringCodec().decode);
    expect(result).toEqual({
      records: ['a', 'b'],
      errors: [],
      partialTail: null,
    });
  });

  it('handles empty content', () => {
    expect(recoverFromContent('', stringCodec().decode)).toEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });

  it('handles content without trailing newline', () => {
    const result = recoverFromContent('a\nb', stringCodec().decode);
    expect(result.records).toEqual(['a']);
    expect(result.partialTail).toBe('b');
  });

  it('skips empty lines', () => {
    const result = recoverFromContent('a\n\nb\n', stringCodec().decode);
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

    const result = recoverFromContent('good\nbad\ngood\n', failingCodec.decode);
    expect(result.records).toEqual(['good', 'good']);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({
      lineNo: 2,
      line: 'bad',
      error: expect.any(Error),
    });
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

    const result = recoverFromContent(
      'good\nbad\npartial',
      failingCodec.decode,
    );
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

  describe('initialization', () => {
    it('should create instance with file path and codec without opening', () => {
      const w = wal('/test/a.log');
      expect(w).toBeInstanceOf(WriteAheadLogFile);
      expect(w.getPath()).toBe('/test/a.log');
      expect(w.isClosed()).toBeTrue();
    });
  });

  describe('lifecycle', () => {
    it('opens and closes correctly', () => {
      const w = wal('/test/a.log');
      expect(w.isClosed()).toBeTrue();
      w.open();
      expect(w.isClosed()).toBeFalse();
      w.close();
      expect(w.isClosed()).toBeTrue();
    });

    it('multiple open calls are idempotent', () => {
      const w = wal('/test/a.log');
      w.open();
      expect(w.isClosed()).toBeFalse();
      w.open();
      w.open();
      expect(w.isClosed()).toBeFalse();
      w.close();
      expect(w.isClosed()).toBeTrue();
    });
  });

  describe('append operations', () => {
    it('throws error when appending without opening', () => {
      const w = wal('/test/a.log');
      expect(() => w.append('a')).toThrow('WAL not opened');
    });

    it('appends records with encoding', () => {
      vol.mkdirSync('/test', { recursive: true });
      const w = wal('/test/a.log');
      w.open();
      w.append('a');
      w.append('b');
      expect(read('/test/a.log')).toBe('"a"\n"b"\n');
    });

    it('handles any kind of data', () => {
      const w = wal('/test/a.log', stringCodec<object>());
      w.open();
      w.append({ id: 1, name: 'test' });
      w.close();
      expect(w.recover().records).toStrictEqual([{ id: 1, name: 'test' }]);
    });
  });

  describe('recovery operations', () => {
    it('returns empty result when file does not exist', () => {
      const result = wal('/test/nonexistent.log').recover();
      expect(result).toEqual({
        records: [],
        errors: [],
        partialTail: null,
      });
    });

    it('recovers valid records from file', () => {
      vol.mkdirSync('/test', { recursive: true });
      write('/test/a.log', 'line1\nline2\n');
      const result = wal('/test/a.log').recover();
      expect(result.records).toStrictEqual(['line1', 'line2']);
      expect(result.errors).toEqual([]);
      expect(result.partialTail).toBeNull();
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

      const result = wal('/test/a.log', tolerantCodec).recover();
      expect(result).toStrictEqual({
        records: ['ok', { __invalid: true, raw: 'bad' }],
        errors: [],
        partialTail: 'partial',
      });
    });
  });

  describe('repack operations', () => {
    it('repacks clean file without errors', () => {
      vol.mkdirSync('/test', { recursive: true });
      write('/test/a.log', '"a"\n"b"\n');
      wal('/test/a.log').repack();
      expect(read('/test/a.log')).toBe('"a"\n"b"\n');
    });

    it('repacks with decode errors using tolerant codec', () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});
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
      // Repack filters out invalid entries, so only valid records remain
      expect(read('/test/a.log')).toBe('ok\n');
      consoleLogSpy.mockRestore();
    });

    it('logs decode errors when recover returns errors', () => {
      const consoleLogSpy = vi
        .spyOn(console, 'log')
        .mockImplementation(() => {});
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

  describe('statistics', () => {
    it('getStats returns file information and recovery state', () => {
      vol.mkdirSync('/test', { recursive: true });
      const w = wal('/test/a.log');
      const stats = w.getStats();
      expect(stats.filePath).toBe('/test/a.log');
      expect(stats.isClosed).toBeTrue();
      expect(stats.lastRecovery).toBeNull();
    });
  });
});

describe('stringCodec', () => {
  it('encodes strings and objects as JSON', () => {
    const codec = stringCodec();
    expect(codec.encode('hello')).toBe('"hello"');
    expect(codec.encode('')).toBe('""');

    const objCodec = stringCodec();
    const obj = { name: 'test', value: 42 };
    expect(objCodec.encode(obj)).toBe('{"name":"test","value":42}');
  });

  it('decodes valid JSON strings', () => {
    const codec = stringCodec();
    expect(codec.decode('{"name":"test","value":42}')).toEqual({
      name: 'test',
      value: 42,
    });
    expect(codec.decode('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('returns strings as-is when JSON parsing fails', () => {
    const codec = stringCodec();
    expect(codec.decode('not json')).toBe('not json');
    expect(codec.decode('{invalid')).toBe('{invalid');
  });

  it('handles special JSON values', () => {
    const codec = stringCodec();
    expect(codec.decode('null')).toBeNull();
    expect(codec.decode('true')).toBeTrue();
    expect(codec.decode('false')).toBeFalse();
    expect(codec.decode('42')).toBe(42);
  });

  it('round-trips values correctly', () => {
    const stringCodecInstance = stringCodec();
    const original = 'hello world';
    expect(
      stringCodecInstance.decode(stringCodecInstance.encode(original)),
    ).toBe(original);

    const objectCodecInstance = stringCodec();
    const obj = { name: 'test', nested: { value: 123 } };
    expect(objectCodecInstance.decode(objectCodecInstance.encode(obj))).toEqual(
      obj,
    );
  });
});

describe('parseWalFormat', () => {
  it('applies all defaults when given empty config', () => {
    const result = parseWalFormat({});
    expect(result.baseName).toBe('wal');
    expect(result.walExtension).toBe('.log');
    expect(result.finalExtension).toBe('.log');
    expect(result.codec).toBeDefined();
    expect(typeof result.finalizer).toBe('function');
  });

  it('uses provided parameters and defaults others', () => {
    const customCodec = stringCodec();
    const result = parseWalFormat({
      baseName: 'test',
      walExtension: '.wal',
      finalExtension: '.json',
      codec: customCodec,
    });
    expect(result.baseName).toBe('test');
    expect(result.walExtension).toBe('.wal');
    expect(result.finalExtension).toBe('.json');
    expect(result.codec.encode('value')).toBe(customCodec.encode('value'));
  });

  it('defaults finalExtension to walExtension when not provided', () => {
    const result = parseWalFormat({ walExtension: '.wal' });
    expect(result.walExtension).toBe('.wal');
    expect(result.finalExtension).toBe('.wal');
  });

  it('uses custom finalizer function', () => {
    const customFinalizer = (records: any[]) => `custom: ${records.length}`;
    const result = parseWalFormat({ finalizer: customFinalizer });
    expect(result.finalizer(['a', 'b'])).toBe('custom: 2');
  });

  it('uses default finalizer when none provided', () => {
    const result = parseWalFormat({ baseName: 'test' });
    expect(result.finalizer(['line1', 'line2'])).toBe('"line1"\n"line2"\n');
    expect(result.finalizer([])).toBe('\n');
  });

  it('encodes objects to JSON strings in default finalizer', () => {
    const result = parseWalFormat({ baseName: 'test' });
    const records = [
      { id: 1, name: 'test' },
      { id: 2, name: 'test2' },
    ];
    expect(result.finalizer(records)).toBe(
      '{"id":1,"name":"test"}\n{"id":2,"name":"test2"}\n',
    );
  });
});
