import { vol } from 'memfs';
import * as fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { readTextFile } from './file-system';
import {
  type LineOutput,
  LineOutputError,
  createLineOutput,
  defaultEncoder,
  defaultParser,
} from './line-output.js';

describe('createLineOutput', () => {
  let outInst: LineOutput | undefined;

  afterEach(() => {
    if (outInst) {
      outInst.close();
      outInst = undefined;
    }
  });

  it('should have the correct file path', () => {
    outInst = createLineOutput({ filePath: 'test.txt' });
    expect(outInst).toHaveProperty('filePath', 'test.txt');
  });

  it('should initialize the file on creation', async () => {
    outInst = createLineOutput({ filePath: 'logs.txt' });

    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'logs.txt')),
    ).resolves.toBe('');
  });

  it('should encode with default encoder and write line immediately without buffering when using writeLineImmediate', async () => {
    outInst = createLineOutput({ filePath: 'test.txt' });
    outInst.writeLineImmediate('[LOG] Parse JSON -> { test: 42 }');
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('[LOG] Parse JSON -> { test: 42 }\n');
  });

  it('should encode with custom encoder and write line immediately without buffering when using writeLineImmediate', async () => {
    outInst = createLineOutput({
      filePath: 'test.txt',
      encode: (obj: unknown) => `[LOG] Parse JSON -> ${JSON.stringify(obj)}`,
    });
    outInst.writeLineImmediate({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('[LOG] Parse JSON -> {"test":42}\n');
  });

  it('should buffer lines without writing to file until flush is called', async () => {
    outInst = createLineOutput({ filePath: 'test.txt' });
    outInst.writeLine({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('');

    outInst.flush();

    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should create ProcessOutput with custom buffer size', async () => {
    outInst = createLineOutput({ filePath: 'test.txt', flushEveryN: 2 });
    outInst.writeLine({ test: 42 });
    outInst.writeLine({ test: 43 });
    outInst.writeLine({ test: 44 });

    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n{"test":43}\n');
  });

  it('should flush the remaining buffer on flush call', async () => {
    outInst = createLineOutput({ filePath: 'test.txt' });
    outInst.writeLine({ test: 42 });
    outInst.flush();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });
  it('should close the output and flush remaining buffer', async () => {
    outInst = createLineOutput({ filePath: 'test.txt' });
    outInst.writeLine({ test: 42 });
    outInst.close();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should not write to file after closing', async () => {
    outInst = createLineOutput({ filePath: 'test.txt' });
    outInst.close();
    outInst.writeLine({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('');
  });

  it('should not write to file using writeLineImmediate after closing', async () => {
    outInst = createLineOutput({ filePath: 'test.txt' });
    outInst.writeLineImmediate({ test: 1 });
    outInst.close();
    outInst.writeLineImmediate({ test: 42 });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":1}\n');
  });

  it('should handle multiple close calls gracefully', async () => {
    outInst = createLineOutput({ filePath: 'test.txt' });
    outInst.writeLine({ test: 42 });
    outInst.close();
    expect(() => outInst!.close()).not.toThrow();
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('{"test":42}\n');
  });

  it('should throw LineOutputError when writeLineImmediate fails', () => {
    outInst = createLineOutput({ filePath: 'test.txt' });

    const writeError = new Error('Write failed');
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw writeError;
    });

    expect(() => outInst!.writeLineImmediate({ test: 42 })).toThrow(
      new LineOutputError(
        'Failed to write to file descriptor for "test.txt"',
        writeError,
      ),
    );

    writeSyncSpy.mockRestore();
  });

  it('should throw LineOutputError when flush fails', () => {
    outInst = createLineOutput({
      filePath: 'test.txt',
      flushEveryN: 1, // Flush immediately
    });

    const flushError = new Error('Flush failed');
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw flushError;
    });

    expect(() => outInst!.writeLine({ test: 42 })).toThrow(
      new LineOutputError(
        'Failed to flush buffer to file descriptor for "test.txt"',
        flushError,
      ),
    );

    writeSyncSpy.mockRestore();
  });

  it('should throw LineOutputError when close fails', () => {
    outInst = createLineOutput({ filePath: 'test.txt' });

    const closeError = new Error('Close failed');
    const closeSyncSpy = vi.spyOn(fs, 'closeSync').mockImplementation(() => {
      throw closeError;
    });

    expect(() => outInst!.close()).toThrow(
      new LineOutputError(
        'Failed to close file descriptor for "test.txt"',
        closeError,
      ),
    );

    closeSyncSpy.mockRestore();
  });

  it('should recover existing file on creation', async () => {
    vol.fromJSON({ 'test.txt': 'test' }, MEMFS_VOLUME);
    outInst = createLineOutput({ filePath: 'test.txt' });
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.txt')),
    ).resolves.toBe('test');
  });

  it('should recover existing file with incomplete line at end', async () => {
    vol.fromJSON(
      {
        'test.jsonl': `{"complete": 42}\n{"incomplete": `,
      },
      MEMFS_VOLUME,
    );

    // First check the file exists with incomplete content
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.jsonl')),
    ).resolves.toBe('{"complete": 42}\n{"incomplete": ');

    outInst = createLineOutput({
      filePath: 'test.jsonl',
      parse: (line: string) => JSON.parse(line),
    });

    // After recovery, the incomplete line should be removed
    await expect(
      readTextFile(path.join(MEMFS_VOLUME, 'test.jsonl')),
    ).resolves.toBe('{"complete": 42}\n');
  });
});

describe('LineOutputError', () => {
  it('should create LineOutputError with cause', () => {
    const cause = new Error('Original error');
    const error = new LineOutputError('Test message', cause);

    expect(error.message).toBe('Test message');
    expect(error.cause).toBe(cause);
    expect(error.name).toBe('LineOutputError');
  });

  it('should create LineOutputError without cause', () => {
    const error = new LineOutputError('Test message');

    expect(error.message).toBe('Test message');
    expect(error.cause).toBeUndefined();
    expect(error.name).toBe('LineOutputError');
  });
});

describe('defaultEncoder', () => {
  it('should return string as-is when input is a string', () => {
    const input = 'test string';
    const result = defaultEncoder(input);
    expect(result).toBe('test string');
  });

  it('should JSON stringify when input is an object', () => {
    const input = { test: 42, message: 'hello' };
    const result = defaultEncoder(input);
    expect(result).toBe('{"test":42,"message":"hello"}');
  });

  it('should JSON stringify when input is a number', () => {
    const input = 42;
    const result = defaultEncoder(input);
    expect(result).toBe('42');
  });

  it('should JSON stringify when input is an array', () => {
    const input = [1, 2, 3];
    const result = defaultEncoder(input);
    expect(result).toBe('[1,2,3]');
  });

  it('should JSON stringify when input is null', () => {
    const input = null;
    const result = defaultEncoder(input);
    expect(result).toBe('null');
  });

  it('should JSON stringify when input is undefined', () => {
    const input = undefined;
    const result = defaultEncoder(input);
    expect(result).toBeUndefined();
  });
});

describe('defaultParser', () => {
  it('should return the line string cast as unknown then as Decoded type', () => {
    const input = '{"test":42}';
    const result = defaultParser(input);
    expect(result).toBe('{"test":42}');
  });

  it('should work with different string inputs', () => {
    const inputs = ['simple string', '123', 'true', '', 'hello world'];

    inputs.forEach(input => {
      const result = defaultParser(input);
      expect(result).toBe(input);
    });
  });
});
