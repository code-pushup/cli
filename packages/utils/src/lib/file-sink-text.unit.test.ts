import { vol } from 'memfs';
import * as fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  FileSink,
  type FileSinkOptions,
  stringDecode,
  stringEncode,
  stringRecover,
} from './file-sink-text.js';

describe('stringEncode', () => {
  it('stringEncode() should encode string input with newline', () => {
    const str = 'test string';
    expect(stringEncode(str)).toBe(`${str}\n`);
  });

  it('stringEncode() should encode non-string input as JSON with newline', () => {
    const obj = { key: 'value', number: 42 };
    expect(stringEncode(obj)).toBe(`${JSON.stringify(obj)}\n`);
  });

  it('stringEncode() should handle null input', () => {
    expect(stringEncode(null)).toBe('null\n');
  });

  it('stringEncode() should handle undefined input', () => {
    expect(stringEncode(undefined)).toBe('undefined\n');
  });
});

describe('stringDecode', () => {
  it('stringDecode() should decode Buffer to string', () => {
    const str = 'test content';
    expect(stringDecode(Buffer.from(str))).toBe(str);
  });

  it('stringDecode() should return string input as-is', () => {
    const str = 'test string';
    expect(stringDecode(str)).toBe(str);
  });
});

describe('stringRecover', () => {
  it('stringRecover() should recover records from valid file content', () => {
    const filePath = '/tmp/stringRecover-test.txt';
    vol.fromJSON({
      [filePath]: 'line1\nline2\nline3\n',
    });

    expect(stringRecover(filePath, (line: string) => line)).toStrictEqual({
      records: ['line1', 'line2', 'line3'],
      errors: [],
      partialTail: null,
    });
  });

  it('stringRecover() should recover records and apply decode function', () => {
    const filePath = '/tmp/stringRecover-test.txt';
    vol.fromJSON({
      [filePath]: 'line1\nline2\nline3\n',
    });

    expect(
      stringRecover(filePath, (line: string) => line.toUpperCase()),
    ).toStrictEqual({
      records: ['LINE1', 'LINE2', 'LINE3'],
      errors: [],
      partialTail: null,
    });
  });

  it('stringRecover() should skip empty lines', () => {
    const filePath = '/tmp/stringRecover-empty-test.txt';
    vol.fromJSON({
      [filePath]: 'line1\n\nline2\n',
    });

    expect(stringRecover(filePath, (line: string) => line)).toStrictEqual({
      records: ['line1', 'line2'],
      errors: [],
      partialTail: null,
    });
  });

  it('stringRecover() should handle decode errors and continue processing', () => {
    const filePath = '/tmp/stringRecover-error-test.txt';
    vol.fromJSON({
      [filePath]: 'valid\ninvalid\nanother',
    });

    expect(
      stringRecover(filePath, (line: string) => {
        if (line === 'invalid') throw new Error('Invalid line');
        return line.toUpperCase();
      }),
    ).toStrictEqual({
      records: ['VALID', 'ANOTHER'],
      errors: [
        {
          lineNo: 2,
          line: 'invalid',
          error: expect.any(Error),
        },
      ],
      partialTail: 'invalid',
    });
  });

  it('stringRecover() should include invalid records when keepInvalid option is true', () => {
    const filePath = '/tmp/stringRecover-invalid-test.txt';
    vol.fromJSON({
      [filePath]: 'valid\ninvalid\n',
    });

    expect(
      stringRecover(
        filePath,
        (line: string) => {
          if (line === 'invalid') throw new Error('Invalid line');
          return line.toUpperCase();
        },
        { keepInvalid: true },
      ),
    ).toStrictEqual({
      records: ['VALID', { __invalid: true, lineNo: 2, line: 'invalid' }],
      errors: [expect.any(Object)],
      partialTail: 'invalid',
    });
  });

  it('stringRecover() should handle file read errors gracefully', () => {
    expect(
      stringRecover('/nonexistent/file.txt', (line: string) => line),
    ).toStrictEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });
});

describe('FileSink', () => {
  it('constructor should create instance with options', () => {
    const options: FileSinkOptions = {
      filePath: '/tmp/test-file.txt',
      recover: vi
        .fn()
        .mockReturnValue({ records: [], errors: [], partialTail: null }),
      finalize: vi.fn(),
    };
    expect(new FileSink(options).options).toBe(options);
  });

  it('getFilePath() should return the file path', () => {
    const filePath = '/tmp/test-file.txt';
    const sink = new FileSink({ filePath });
    expect(sink.getFilePath()).toBe(filePath);
  });

  it('encode() should encode input using stringEncode', () => {
    const sink = new FileSink({ filePath: '/tmp/test.txt' });
    const str = 'test input';
    expect(sink.encode(str)).toBe(`${str}\n`);
  });

  it('decode() should decode output using stringDecode', () => {
    const sink = new FileSink({ filePath: '/tmp/test.txt' });
    const str = 'test output';
    expect(sink.decode(str)).toBe(str);
  });

  it('open() should handle directory creation and file opening', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    sink.open();
    expect(fs.existsSync('/tmp/test-file.txt')).toBe(true);
  });

  it('open() should repack file when withRepack is true', () => {
    const sink = new FileSink({
      filePath: '/tmp/test-file.txt',
      recover: vi
        .fn()
        .mockReturnValue({ records: [], errors: [], partialTail: null }),
    });
    const spy = vi.spyOn(sink, 'repack');
    sink.open(true);
    expect(spy).toHaveBeenCalledWith('/tmp/test-file.txt');
  });

  it('close() should close file descriptor if open', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    sink.open();
    expect(() => sink.close()).not.toThrow();
  });

  it('close() should do nothing if file descriptor is not open', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    expect(() => sink.close()).not.toThrow();
  });

  it('write() should write encoded input to file when sink is open', () => {
    const sink = new FileSink({ filePath: '/tmp/write-open-unique-test.txt' });
    sink.open();
    const str = 'test data';
    sink.write(str);
    expect(fs.readFileSync('/tmp/write-open-unique-test.txt', 'utf8')).toBe(
      `${str}\n`,
    );
  });

  it('write() should silently ignore writes when file descriptor is not open', () => {
    const sink = new FileSink({ filePath: '/tmp/write-test-closed.txt' });
    expect(() => sink.write('test data')).not.toThrow();
  });

  it('write() should silently ignore write errors when fs.writeSync throws', () => {
    const sink = new FileSink({ filePath: '/tmp/write-error-test.txt' });
    sink.open();

    // Mock fs.writeSync to throw an error
    const writeSyncSpy = vi.spyOn(fs, 'writeSync').mockImplementation(() => {
      throw new Error('Write error');
    });

    try {
      // This should not throw despite the write error
      expect(() => sink.write('test data')).not.toThrow();
    } finally {
      // Restore original function
      writeSyncSpy.mockRestore();
      sink.close();
    }
  });

  it('recover() should call the recover function from options', () => {
    const mockRecover = vi
      .fn()
      .mockReturnValue({ records: ['test'], errors: [], partialTail: null });
    const sink = new FileSink({
      filePath: '/tmp/test-file.txt',
      recover: mockRecover,
    });
    expect(sink.recover()).toStrictEqual({
      records: ['test'],
      errors: [],
      partialTail: null,
    });
    expect(mockRecover).toHaveBeenCalledWith();
  });

  it('repack() should recover records and write them to output path', () => {
    const mockRecover = vi.fn();
    const filePath = '/tmp/test-file.txt';
    const sink = new FileSink({
      filePath,
      recover: mockRecover,
    });
    const records = ['record1', 'record2'];
    mockRecover.mockReturnValue({ records, errors: [], partialTail: null });

    sink.repack();
    expect(mockRecover).toHaveBeenCalled();
    expect(fs.readFileSync(filePath, 'utf8')).toBe('record1\n\nrecord2\n');
  });

  it('repack() should accept output path', () => {
    const mockRecover = vi.fn();
    const sink = new FileSink({
      filePath: '/tmp/test-file.txt',
      recover: mockRecover,
    });
    const records = ['record1', 'record2'];
    mockRecover.mockReturnValue({ records, errors: [], partialTail: null });
    const outputPath = '/tmp/repack-output.txt';
    sink.repack(outputPath);
    expect(mockRecover).toHaveBeenCalled();
    expect(fs.readFileSync(outputPath, 'utf8')).toBe('record1\n\nrecord2\n');
  });

  it('finalize() should call the finalize function from options', () => {
    const mockFinalize = vi.fn();
    const sink = new FileSink({
      filePath: '/tmp/test-file.txt',
      finalize: mockFinalize,
    });
    sink.finalize();
    expect(mockFinalize).toHaveBeenCalledTimes(1);
  });

  it('isClosed() should return true when sink is not opened', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    expect(sink.isClosed()).toBe(true);
  });

  it('isClosed() should return false when sink is opened', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    sink.open();
    expect(sink.isClosed()).toBe(false);
  });

  it('isClosed() should return true when sink is closed after being opened', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    sink.open();
    expect(sink.isClosed()).toBe(false);
    sink.close();
    expect(sink.isClosed()).toBe(true);
  });
});
