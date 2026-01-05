import { vol } from 'memfs';
import * as fs from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  JsonlFileSink,
  jsonlDecode,
  jsonlEncode,
  recoverJsonlFile,
} from './file-sink-json.js';

describe('jsonlEncode', () => {
  it('should encode object to JSON string with newline', () => {
    const obj = { key: 'value', number: 42 };
    expect(jsonlEncode(obj)).toBe(`${JSON.stringify(obj)}\n`);
  });

  it('should handle nested objects', () => {
    const obj = { nested: { deep: 'value' }, array: [1, 2, 3] };
    expect(jsonlEncode(obj)).toBe(`${JSON.stringify(obj)}\n`);
  });

  it('should handle empty object', () => {
    expect(jsonlEncode({})).toBe('{}\n');
  });
});

describe('jsonlDecode', () => {
  it('should decode JSON string to object', () => {
    const obj = { key: 'value', number: 42 };
    const jsonStr = `${JSON.stringify(obj)}\n`;
    expect(jsonlDecode(jsonStr)).toStrictEqual(obj);
  });

  it('should handle nested objects', () => {
    const obj = { nested: { deep: 'value' }, array: [1, 2, 3] };
    const jsonStr = `${JSON.stringify(obj)}\n`;
    expect(jsonlDecode(jsonStr)).toStrictEqual(obj);
  });

  it('should trim whitespace before parsing', () => {
    const obj = { key: 'value' };
    const jsonStr = `  ${JSON.stringify(obj)}  \n`;
    expect(jsonlDecode(jsonStr)).toStrictEqual(obj);
  });

  it('should throw on invalid JSON', () => {
    expect(() => jsonlDecode('invalid json\n')).toThrow();
  });
});

describe('recoverJsonlFile', () => {
  it('should recover JSONL file with single object', () => {
    const path = '/tmp/recover-single.jsonl';
    const obj = { key: 'value', number: 42 };
    fs.writeFileSync(path, `${JSON.stringify(obj)}\n`);

    expect(recoverJsonlFile(path)).toStrictEqual({
      records: [obj],
      errors: [],
      partialTail: null,
    });
  });

  it('should recover JSONL file with multiple objects', () => {
    const path = '/tmp/recover-multi.jsonl';
    const obj1 = { id: 1, name: 'first' };
    const obj2 = { id: 2, name: 'second' };
    fs.writeFileSync(
      path,
      `${JSON.stringify(obj1)}\n${JSON.stringify(obj2)}\n`,
    );

    expect(recoverJsonlFile(path)).toStrictEqual({
      records: [obj1, obj2],
      errors: [],
      partialTail: null,
    });
  });

  it('should handle JSON parsing errors', () => {
    const path = '/tmp/recover-error.jsonl';
    fs.writeFileSync(
      path,
      '{"valid": "json"}\ninvalid json\n{"also": "valid"}\n',
    );

    const result = recoverJsonlFile(path);
    expect(result.records).toStrictEqual([
      { valid: 'json' },
      { also: 'valid' },
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe('invalid json');
    expect(result.partialTail).toBe('invalid json');
  });

  it('should support keepInvalid option', () => {
    const path = '/tmp/recover-keep-invalid.jsonl';
    fs.writeFileSync(path, '{"valid": "json"}\ninvalid json\n');

    const result = recoverJsonlFile(path, { keepInvalid: true });
    expect(result.records).toStrictEqual([
      { valid: 'json' },
      { __invalid: true, lineNo: 2, line: 'invalid json' },
    ]);
    expect(result.errors).toHaveLength(1);
  });
});

describe('JsonlFileSink class', () => {
  it('should encode objects as JSON', () => {
    const sink = new JsonlFileSink({ filePath: '/tmp/jsonl-test.txt' });
    const obj = { key: 'value', number: 42 };
    expect(sink.encode(obj)).toBe(`${JSON.stringify(obj)}\n`);
  });

  it('should decode JSON strings to objects', () => {
    const sink = new JsonlFileSink({ filePath: '/tmp/jsonl-test.txt' });
    const obj = { key: 'value', number: 42 };
    const jsonStr = `${JSON.stringify(obj)}\n`;
    expect(sink.decode(jsonStr)).toStrictEqual(obj);
  });

  it('should handle file operations with JSONL format', () => {
    const path = '/tmp/jsonl-file-ops-test.txt';
    const sink = new JsonlFileSink({ filePath: path });
    sink.open();

    const obj1 = { id: 1, name: 'first' };
    const obj2 = { id: 2, name: 'second' };
    sink.write(obj1);
    sink.write(obj2);
    sink.close();

    const recovered = sink.recover();
    expect(recovered.records).toStrictEqual([obj1, obj2]);
  });
});
