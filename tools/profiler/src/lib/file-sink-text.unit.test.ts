import { vol } from 'memfs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FileSink,
  type FileSinkOptions,
  stringDecode,
  stringEncode,
  stringRecover,
} from './file-sink-text.js';

describe('stringEncode', () => {
  it('should encode string input', () => {
    const str = 'test string';
    expect(stringEncode(str)).toBe(`${str}\n`);
  });

  it('should encode non-string input as JSON', () => {
    const obj = { key: 'value', number: 42 };
    expect(stringEncode(obj)).toBe(`${JSON.stringify(obj)}\n`);
  });

  it('should handle null', () => {
    expect(stringEncode(null)).toBe('null\n');
  });
  it('should handle undefined', () => {
    expect(stringEncode(undefined)).toBe('undefined\n');
  });
});

describe('stringDecode', () => {
  it('should decode Buffer to string', () => {
    const str = 'test content';
    expect(stringDecode(Buffer.from(str))).toBe(str);
  });

  it('should decode string as-is', () => {
    const str = 'test string';
    expect(stringDecode(str)).toBe(str);
  });
});

describe('stringRecover', () => {
  it('should recover records from valid file content', () => {
    const path = '/tmp/stringRecover-test.txt';
    vol.fromJSON({
      [path]: 'line1\nline2\nline3\n',
    });

    expect(stringRecover(path, (line: string) => line)).toStrictEqual({
      records: ['line1', 'line2', 'line3'],
      errors: [],
      partialTail: null,
    });
  });

  it('should recover records from valid file content and use decode function', () => {
    const path = '/tmp/stringRecover-test.txt';
    vol.fromJSON({
      [path]: 'line1\nline2\nline3\n',
    });

    expect(
      stringRecover(path, (line: string) => line.toUpperCase()),
    ).toStrictEqual({
      records: ['LINE1', 'LINE2', 'LINE3'],
      errors: [],
      partialTail: null,
    });
  });

  it('should handle empty lines', () => {
    const path = '/tmp/stringRecover-empty-test.txt';
    vol.fromJSON({
      [path]: 'line1\n\nline2\n',
    });

    expect(stringRecover(path, (line: string) => line)).toStrictEqual({
      records: ['line1', 'line2'],
      errors: [],
      partialTail: null,
    });
  });

  it('should handle decode errors', () => {
    const path = '/tmp/stringRecover-error-test.txt';
    vol.fromJSON({
      [path]: 'valid\ninvalid\nanother',
    });

    expect(
      stringRecover(path, (line: string) => {
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

  it('should include invalid records when keepInvalid is true', () => {
    const path = '/tmp/stringRecover-invalid-test.txt';
    vol.fromJSON({
      [path]: 'valid\ninvalid\n',
    });

    expect(
      stringRecover(
        path,
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

  it('should handle file read errors gracefully', () => {
    expect(
      stringRecover('/nonexistent/file.txt', (line: string) => line),
    ).toStrictEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });
});

describe('FileSink class', () => {
  it('should create FileSink instance with options', () => {
    const options: FileSinkOptions = {
      filePath: '/tmp/test-file.txt',
      recover: vi
        .fn()
        .mockReturnValue({ records: [], errors: [], partialTail: null }),
      finalize: vi.fn(),
    };
    expect(new FileSink(options).options).toBe(options);
  });

  it('should return the file path', () => {
    const path = '/tmp/test-file.txt';
    const sink = new FileSink({ filePath: path });
    expect(sink.getFilePath()).toBe(path);
  });

  it('should encode input using stringEncode', () => {
    const sink = new FileSink({ filePath: '/tmp/test.txt' });
    const str = 'test input';
    expect(sink.encode(str)).toBe(`${str}\n`);
  });

  it('should decode output using stringDecode', () => {
    const sink = new FileSink({ filePath: '/tmp/test.txt' });
    const str = 'test output';
    expect(sink.decode(str)).toBe(str);
  });

  it('should handle directory creation and file opening', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    sink.open();
    expect(fs.existsSync('/tmp/test-file.txt')).toBe(true);
  });

  it('should repack file when withRepack is true', () => {
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

  it('should close file descriptor if open', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    sink.open();
    expect(() => sink.close()).not.toThrow();
  });

  it('should do nothing if file descriptor is not open', () => {
    const sink = new FileSink({ filePath: '/tmp/test-file.txt' });
    expect(() => sink.close()).not.toThrow();
  });

  it('should write encoded input to file when sink is open', () => {
    const sink = new FileSink({ filePath: '/tmp/write-open-unique-test.txt' });
    sink.open();
    const str = 'test data';
    sink.write(str);
    expect(fs.readFileSync('/tmp/write-open-unique-test.txt', 'utf8')).toBe(
      `${str}\n`,
    );
  });

  it('should silently ignore writes when file descriptor is not open', () => {
    const sink = new FileSink({ filePath: '/tmp/write-test-closed.txt' });
    expect(() => sink.write('test data')).not.toThrow();
  });

  it('should call the recover function from options', () => {
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

  it('should recover records and write them to output path', () => {
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

  it('should call the finalize function from options', () => {
    const mockFinalize = vi.fn();
    const sink = new FileSink({
      filePath: '/tmp/test-file.txt',
      finalize: mockFinalize,
    });
    sink.finalize();
    expect(mockFinalize).toHaveBeenCalledTimes(1);
  });
});
