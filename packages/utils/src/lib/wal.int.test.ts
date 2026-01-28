import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { WriteAheadLogFile, createTolerantCodec, stringCodec } from './wal.js';

describe('WriteAheadLogFile Integration', () => {
  const testDir = path.join(process.cwd(), 'tmp', 'int', 'utils', 'wal');
  let walFile: WriteAheadLogFile<string>;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (walFile && !walFile.isClosed()) {
      walFile.close();
    }
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
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

  it('should handle multiple append operations with recovery', () => {
    const filePath = path.join(testDir, 'multi.log');
    walFile = new WriteAheadLogFile({ file: filePath, codec: stringCodec() });

    walFile.open();
    for (let i = 1; i <= 10; i++) {
      walFile.append(`record${i}`);
    }
    walFile.close();

    const recovered = walFile.recover();
    expect(recovered.records).toHaveLength(10);
    expect(recovered.records[0]).toBe('record1');
    expect(recovered.records[9]).toBe('record10');
  });

  it('should recover from file with partial write', () => {
    const filePath = path.join(testDir, 'partial.log');
    walFile = new WriteAheadLogFile({ file: filePath, codec: stringCodec() });

    walFile.open();
    walFile.append('complete1');
    walFile.append('complete2');
    walFile.close();

    // Simulate partial write by appending incomplete line
    fs.appendFileSync(filePath, '"partial');

    const recovered = walFile.recover();
    expect(recovered.records).toEqual(['complete1', 'complete2']);
    expect(recovered.partialTail).toBe('"partial');
  });

  it('should repack file removing invalid entries', () => {
    const filePath = path.join(testDir, 'repack.log');
    const tolerantCodec = createTolerantCodec({
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'invalid') throw new Error('Invalid record');
        return s;
      },
    });

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
    const failingCodec = createTolerantCodec({
      encode: (s: string) => s,
      decode: (s: string) => {
        if (s === 'bad') throw new Error('Bad record');
        return s;
      },
    });

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

  it('should maintain file state across operations', () => {
    const filePath = path.join(testDir, 'state.log');
    walFile = new WriteAheadLogFile({ file: filePath, codec: stringCodec() });

    expect(walFile.isClosed()).toBeTrue();
    expect(walFile.getStats().fileExists).toBeFalse();

    walFile.open();
    expect(walFile.isClosed()).toBeFalse();

    walFile.append('test');
    walFile.close();

    // Recover to populate lastRecovery state
    walFile.recover();

    const stats = walFile.getStats();
    expect(stats.fileExists).toBeTrue();
    expect(stats.fileSize).toBeGreaterThan(0);
    expect(stats.lastRecovery).not.toBeNull();
  });

  it('should handle object records correctly', () => {
    const filePath = path.join(testDir, 'objects.log');
    walFile = new WriteAheadLogFile({
      file: filePath,
      codec: stringCodec<object>(),
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
});
