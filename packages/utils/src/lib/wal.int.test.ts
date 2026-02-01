import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WriteAheadLogFile, stringCodec, type WalRecord, type Codec } from './wal.js';

describe('WriteAheadLogFile Integration', () => {
  const testDir = path.join(process.cwd(), 'tmp', 'int', 'utils', 'wal');
  let walFile: WriteAheadLogFile;

  beforeEach(async () => {
    // Clean up test directory
    await fs.rm(testDir, { recursive: true, force: true });
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    if (walFile && !walFile.isClosed()) {
      walFile.close();
    }
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should recover from file with partial write', async () => {
    const filePath = path.join(testDir, 'partial.log');
    walFile = new WriteAheadLogFile({ file: filePath, codec: stringCodec() });

    walFile.open();
    walFile.append('complete1');
    walFile.append('complete2');
    walFile.close();

    // Simulate partial write by appending incomplete line
    await fs.appendFile(filePath, '"partial');

    const recovered = walFile.recover();
    expect(recovered.records).toEqual(['complete1', 'complete2']);
    expect(recovered.partialTail).toBe('"partial');
  });

  it('should repack file removing invalid entries', () => {
    const filePath = path.join(testDir, 'repack.log');
    const tolerantCodec: Codec<WalRecord> = {
      encode: v => (typeof v === 'string' ? v : JSON.stringify(v)),
      decode: (s: string) => {
        if (s === 'invalid') throw new Error('Invalid record');
        return s;
      },
    };

    walFile = new WriteAheadLogFile({ file: filePath, codec: tolerantCodec });
    walFile.open();
    walFile.append('valid1');
    walFile.append('invalid');
    walFile.append('valid2');
    walFile.close();

    walFile.repack();

    const recovered = walFile.recover();
    expect(recovered.records).toEqual(['valid1', 'valid2']);
  });

  it('should handle error recovery scenarios', () => {
    const filePath = path.join(testDir, 'errors.log');
    const failingCodec: Codec<WalRecord> = {
      encode: v => (typeof v === 'string' ? v : JSON.stringify(v)),
      decode: (s: string) => {
        if (s === 'bad') throw new Error('Bad record');
        return s;
      },
    };

    walFile = new WriteAheadLogFile({ file: filePath, codec: failingCodec });
    walFile.open();
    walFile.append('good');
    walFile.append('bad');
    walFile.append('good');
    walFile.close();

    const recovered = walFile.recover();
    expect(recovered.records).toEqual([
      'good',
      { __invalid: true, raw: 'bad' },
      'good',
    ]);
    expect(recovered.errors).toEqual([]);
  });

  it('should handle object records correctly', () => {
    const filePath = path.join(testDir, 'objects.log');
    walFile = new WriteAheadLogFile({
      file: filePath,
      codec: stringCodec(),
    });

    walFile.open();
    walFile.append({ id: 1, name: 'test1' });
    walFile.append({ id: 2, name: 'test2' });
    walFile.close();

    const recovered = walFile.recover();
    expect(recovered.records).toEqual([
      { id: 1, name: 'test1' },
      { id: 2, name: 'test2' },
    ]);
  });

  it('should perform complete write/recover cycle', () => {
    const filePath = path.join(testDir, 'test.log');
    walFile = new WriteAheadLogFile({ file: filePath, codec: stringCodec() });

    walFile.open();
    walFile.append('record1');
    walFile.append('record2');
    walFile.close();

    const recovered = walFile.recover();
    expect(recovered.records).toEqual(['record1', 'record2']);
    expect(recovered.errors).toEqual([]);
    expect(recovered.partialTail).toBeNull();
  });

});
