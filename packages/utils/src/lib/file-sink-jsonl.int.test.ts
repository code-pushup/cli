import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { teardownTestFolder } from '@code-pushup/test-utils';
import { JsonlFile, recoverJsonlFile } from './file-sink-jsonl.js';

describe('JsonlFile integration', () => {
  const baseDir = path.join(os.tmpdir(), 'file-sink-json-int-tests');
  const testFile = path.join(baseDir, 'test-data.jsonl');

  beforeAll(async () => {
    await fs.promises.mkdir(baseDir, { recursive: true });
  });

  beforeEach(async () => {
    try {
      await fs.promises.unlink(testFile);
    } catch {
      // File doesn't exist, which is fine
    }
  });

  afterAll(async () => {
    await teardownTestFolder(baseDir);
  });

  describe('file operations', () => {
    const testData = [
      { id: 1, name: 'Alice', active: true },
      { id: 2, name: 'Bob', active: false },
      { id: 3, name: 'Charlie', active: true },
    ];

    it('should write and read JSONL files', async () => {
      const sink = new JsonlFile({ filePath: testFile });

      // Open and write data
      sink.open();
      testData.forEach(item => sink.write(item));
      sink.close();

      expect(fs.existsSync(testFile)).toBe(true);
      const fileContent = fs.readFileSync(testFile, 'utf8');
      const lines = fileContent.trim().split('\n');
      expect(lines).toStrictEqual([
        '{"id":1,"name":"Alice","active":true}',
        '{"id":2,"name":"Bob","active":false}',
        '{"id":3,"name":"Charlie","active":true}',
      ]);

      lines.forEach((line, index) => {
        const parsed = JSON.parse(line);
        expect(parsed).toStrictEqual(testData[index]);
      });
    });

    it('should recover data from JSONL files', async () => {
      const jsonlContent = `${testData.map(item => JSON.stringify(item)).join('\n')}\n`;
      fs.writeFileSync(testFile, jsonlContent);

      expect(recoverJsonlFile(testFile)).toStrictEqual({
        records: testData,
        errors: [],
        partialTail: null,
      });
    });

    it('should handle JSONL files with parse errors', async () => {
      const mixedContent =
        '{"id":1,"name":"Alice"}\n' +
        'invalid json line\n' +
        '{"id":2,"name":"Bob"}\n' +
        '{"id":3,"name":"Charlie","incomplete":\n';

      fs.writeFileSync(testFile, mixedContent);

      expect(recoverJsonlFile(testFile)).toStrictEqual({
        records: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        errors: [
          expect.objectContaining({ line: 'invalid json line' }),
          expect.objectContaining({
            line: '{"id":3,"name":"Charlie","incomplete":',
          }),
        ],
        partialTail: '{"id":3,"name":"Charlie","incomplete":',
      });
    });

    it('should recover data using JsonlFileSink.recover()', async () => {
      const sink = new JsonlFile({ filePath: testFile });
      sink.open();
      testData.forEach(item => sink.write(item));
      sink.close();

      expect(sink.recover()).toStrictEqual({
        records: testData,
        errors: [],
        partialTail: null,
      });
    });

    describe('edge cases', () => {
      it('should handle empty files', async () => {
        fs.writeFileSync(testFile, '');

        expect(recoverJsonlFile(testFile)).toStrictEqual({
          records: [],
          errors: [],
          partialTail: null,
        });
      });

      it('should handle files with only whitespace', async () => {
        fs.writeFileSync(testFile, '   \n  \n\t\n');

        expect(recoverJsonlFile(testFile)).toStrictEqual({
          records: [],
          errors: [],
          partialTail: null,
        });
      });

      it('should handle non-existent files', async () => {
        const nonExistentFile = path.join(baseDir, 'does-not-exist.jsonl');

        expect(recoverJsonlFile(nonExistentFile)).toStrictEqual({
          records: [],
          errors: [],
          partialTail: null,
        });
      });
    });
  });
});
