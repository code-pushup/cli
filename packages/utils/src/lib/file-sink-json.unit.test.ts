import { vol } from 'memfs';
import * as fs from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  JsonlFileSink,
  jsonlDecode,
  jsonlEncode,
  recoverJsonlFile,
} from './file-sink-json.js';

describe('jsonlEncode', () => {
  it('should encode object to JSON string', () => {
    const obj = { key: 'value', number: 42 };
    expect(jsonlEncode(obj)).toBe(JSON.stringify(obj));
  });

  it('should handle nested objects', () => {
    const obj = { nested: { deep: 'value' }, array: [1, 2, 3] };
    expect(jsonlEncode(obj)).toBe(JSON.stringify(obj));
  });

  it('should handle empty object', () => {
    expect(jsonlEncode({})).toBe('{}');
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
    expect(() => jsonlDecode('invalid json\n')).toThrow('Unexpected token');
  });

  it('should handle Buffer input', () => {
    const obj = { key: 'value', number: 42 };
    const jsonStr = `${JSON.stringify(obj)}\n`;
    expect(jsonlDecode(Buffer.from(jsonStr))).toStrictEqual(obj);
  });

  it('should handle primitive JSON values', () => {
    expect(jsonlDecode('"string"\n')).toBe('string');
    expect(jsonlDecode('42\n')).toBe(42);
    expect(jsonlDecode('true\n')).toBe(true);
    expect(jsonlDecode('null\n')).toBeNull();
  });
});

describe('recoverJsonlFile', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        '/tmp': null,
      },
      MEMFS_VOLUME,
    );
  });

  it('should recover JSONL file with single object', () => {
    const filePath = '/tmp/recover-single.jsonl';
    const obj = { key: 'value', number: 42 };
    fs.writeFileSync(filePath, `${JSON.stringify(obj)}\n`);

    expect(recoverJsonlFile(filePath)).toStrictEqual({
      records: [obj],
      errors: [],
      partialTail: null,
    });
  });

  it('should recover JSONL file with multiple objects', () => {
    const filePath = '/tmp/recover-multi.jsonl';
    const obj1 = { id: 1, name: 'first' };
    const obj2 = { id: 2, name: 'second' };
    fs.writeFileSync(
      filePath,
      `${JSON.stringify(obj1)}\n${JSON.stringify(obj2)}\n`,
    );

    expect(recoverJsonlFile(filePath)).toStrictEqual({
      records: [obj1, obj2],
      errors: [],
      partialTail: null,
    });
  });

  it('should handle JSON parsing errors', () => {
    const filePath = '/tmp/recover-error.jsonl';
    fs.writeFileSync(
      filePath,
      '{"valid": "json"}\ninvalid json line\n{"id":3,"name":"Charlie","incomplete":\n',
    );

    const result = recoverJsonlFile(filePath);
    expect(result.records).toStrictEqual([{ valid: 'json' }]);
    expect(result.errors).toStrictEqual([
      expect.objectContaining({ line: 'invalid json line' }),
      expect.objectContaining({
        line: '{"id":3,"name":"Charlie","incomplete":',
      }),
    ]);
    expect(result.partialTail).toBe('{"id":3,"name":"Charlie","incomplete":');
  });

  it('should support keepInvalid option', () => {
    const filePath = '/tmp/recover-keep-invalid.jsonl';
    fs.writeFileSync(filePath, '{"valid": "json"}\ninvalid json\n');

    const result = recoverJsonlFile(filePath, { keepInvalid: true });
    expect(result.records).toStrictEqual([
      { valid: 'json' },
      { __invalid: true, lineNo: 2, line: 'invalid json' },
    ]);
    expect(result.errors).toHaveLength(1);
  });

  it('should handle empty files', () => {
    const filePath = '/tmp/recover-empty.jsonl';
    fs.writeFileSync(filePath, '');

    expect(recoverJsonlFile(filePath)).toStrictEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });

  it('should handle file read errors gracefully', () => {
    expect(recoverJsonlFile('/nonexistent/file.jsonl')).toStrictEqual({
      records: [],
      errors: [],
      partialTail: null,
    });
  });
});

describe('JsonlFileSink', () => {
  beforeEach(() => {
    vol.fromJSON(
      {
        '/tmp': null,
      },
      MEMFS_VOLUME,
    );
  });

  type JsonObj = { key: string; number: number };

  it('should encode objects as JSON', () => {
    const sink = new JsonlFileSink<JsonObj>({
      filePath: '/tmp/jsonl-test.jsonl',
    });
    const obj = { key: 'value', number: 42 };
    expect(sink.encode(obj)).toBe(`${JSON.stringify(obj)}\n`);
  });

  it('should decode JSON strings to objects', () => {
    const sink = new JsonlFileSink<JsonObj>({
      filePath: '/tmp/jsonl-test.jsonl',
    });
    const obj = { key: 'value', number: 42 };
    const jsonStr = `${JSON.stringify(obj)}\n`;
    expect(sink.decode(jsonStr)).toStrictEqual(obj);
  });

  it('should handle file operations with JSONL format', () => {
    const filePath = '/tmp/jsonl-file-ops-test.jsonl';
    const sink = new JsonlFileSink<JsonObj>({ filePath });
    sink.open();

    const obj1 = { key: 'value', number: 42 };
    const obj2 = { key: 'value', number: 42 };
    sink.write(obj1);
    sink.write(obj2);
    sink.close();

    const recovered = sink.recover();
    expect(recovered.records).toStrictEqual([obj1, obj2]);
  });

  it('repack() should recover records and write them to output path', () => {
    const filePath = '/tmp/jsonl-repack-test.jsonl';
    const sink = new JsonlFileSink<JsonObj>({ filePath });
    const records = [
      { key: 'value', number: 42 },
      { key: 'value', number: 42 },
    ];

    fs.writeFileSync(
      filePath,
      `${records.map(record => JSON.stringify(record)).join('\n')}\n`,
    );

    const outputPath = '/tmp/jsonl-repack-output.jsonl';
    sink.repack(outputPath);
    expect(fs.readFileSync(outputPath, 'utf8')).toBe(
      `${JSON.stringify(records[0])}\n${JSON.stringify(records[1])}\n`,
    );
  });
});
