import { vol } from 'memfs';
import * as fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { readTextFile } from '@code-pushup/utils';
import { ProcessOutputError, createProcessOutput } from './process-output.js';

describe('createProcessOutput', () => {
  it('should have the correct file path', () => {
    expect(createProcessOutput({ filePath: 'test.txt' })).toHaveProperty(
      'filePath',
      'test.txt',
    );
  });

  it('should initialize the file on creation', async () => {
    expect(() => createProcessOutput({ filePath: 'test.txt' })).not.toThrow();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('');
  });

  it('should takeover existing file on creation', async () => {
    vol.fromJSON({ 'test.txt': 'test' }, MEMFS_VOLUME);
    expect(() => createProcessOutput({ filePath: 'test.txt' })).not.toThrow();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('test');
  });

  it('should write JSON lines immediately without buffering when using writeLineImmediate', async () => {
    const output = createProcessOutput({ filePath: 'test.txt' });
    output.writeLineImmediate({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should buffer lines without writing to file until flush is called', async () => {
    const output = createProcessOutput({ filePath: 'test.txt' });
    output.writeLine({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('');

    output.flush();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should create ProcessOutput with custom buffer size', async () => {
    const output = createProcessOutput({
      filePath: 'test.txt',
      flushEveryN: 2,
    });
    output.writeLine({ test: 42 });
    output.writeLine({ test: 43 });
    output.writeLine({ test: 44 });

    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n{"test":43}\n');
  });

  it('should flush the remaining buffer on flush call', async () => {
    const output = createProcessOutput({ filePath: 'test.txt' });
    output.writeLine({ test: 42 });
    output.flush();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });
  it('should close the output and flush remaining buffer', async () => {
    const output = createProcessOutput({ filePath: 'test.txt' });
    output.writeLine({ test: 42 });
    output.close();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should not write to file after closing', async () => {
    const output = createProcessOutput({ filePath: 'test.txt' });
    output.close();
    output.writeLine({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('');
  });

  it('should not write to file using writeLineImmediate after closing', async () => {
    const output = createProcessOutput({ filePath: 'test.txt' });
    output.writeLineImmediate({ test: 1 });
    output.close();
    output.writeLineImmediate({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":1}\n');
  });

  it('should handle multiple close calls gracefully', async () => {
    const output = createProcessOutput({ filePath: 'test.txt' });
    output.writeLine({ test: 42 });
    output.close();
    expect(() => output.close()).not.toThrow();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should throw ProcessOutputError when file initialization fails', () => {
    const mkdirError = new Error('dummy');
    const mkdirSyncSpy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {
      throw mkdirError;
    });

    expect(() => createProcessOutput({ filePath: 'test.txt' })).toThrow(
      new ProcessOutputError(
        'Failed to initialize file "test.txt"',
        mkdirError,
      ),
    );

    mkdirSyncSpy.mockRestore();
  });

  it('should throw ProcessOutputError when writeLineImmediate fails', () => {
    const output = createProcessOutput({ filePath: 'test.txt' });

    const writeError = new Error('Write failed');
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw writeError;
    });

    expect(() => output.writeLineImmediate({ test: 42 })).toThrow(
      new ProcessOutputError(
        'Failed to write to file descriptor for "test.txt"',
        writeError,
      ),
    );

    writeSyncSpy.mockRestore();
  });

  it('should throw ProcessOutputError when flush fails', () => {
    const output = createProcessOutput({
      filePath: 'test.txt',
      flushEveryN: 1, // Flush immediately
    });

    const flushError = new Error('Flush failed');
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw flushError;
    });

    expect(() => output.writeLine({ test: 42 })).toThrow(
      new ProcessOutputError(
        'Failed to flush buffer to file descriptor for "test.txt"',
        flushError,
      ),
    );

    writeSyncSpy.mockRestore();
  });

  it('should throw ProcessOutputError when close fails', () => {
    const output = createProcessOutput({ filePath: 'test.txt' });

    const closeError = new Error('Close failed');
    const closeSyncSpy = vi.spyOn(fs, 'closeSync').mockImplementation(() => {
      throw closeError;
    });

    expect(() => output.close()).toThrow(
      new ProcessOutputError(
        'Failed to close file descriptor for "test.txt"',
        closeError,
      ),
    );

    closeSyncSpy.mockRestore();
  });
});
