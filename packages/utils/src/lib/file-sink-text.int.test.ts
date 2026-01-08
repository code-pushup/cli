import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { teardownTestFolder } from '@code-pushup/test-utils';
import { FileSink, stringRecover } from './file-sink-text.js';

describe('FileSink integration', () => {
  const baseDir = path.join(os.tmpdir(), 'file-sink-text-int-tests');
  const testFile = path.join(baseDir, 'test-data.txt');

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
    const testData = ['line1', 'line2', 'line3'];

    it('should write and read text files', async () => {
      const sink = new FileSink({
        filePath: testFile,
        recover: () => stringRecover(testFile, (line: string) => line),
      });

      // Open and write data
      sink.open();
      testData.forEach(item => sink.write(item));
      sink.close();

      expect(fs.existsSync(testFile)).toBe(true);
      const fileContent = fs.readFileSync(testFile, 'utf8');
      const lines = fileContent.trim().split('\n');
      expect(lines).toStrictEqual(testData);

      lines.forEach((line, index) => {
        expect(line).toStrictEqual(testData[index]);
      });
    });

    it('should recover data from text files', async () => {
      const content = `${testData.join('\n')}\n`;
      fs.writeFileSync(testFile, content);

      expect(stringRecover(testFile, (line: string) => line)).toStrictEqual({
        records: testData,
        errors: [],
        partialTail: null,
      });
    });

    it('should handle text files with parse errors', async () => {
      const mixedContent = 'valid\ninvalid\nanother\n';
      fs.writeFileSync(testFile, mixedContent);

      expect(
        stringRecover(testFile, (line: string) => {
          if (line === 'invalid') throw new Error('Invalid line');
          return line.toUpperCase();
        }),
      ).toStrictEqual({
        records: ['VALID', 'ANOTHER'],
        errors: [
          expect.objectContaining({
            lineNo: 2,
            line: 'invalid',
            error: expect.any(Error),
          }),
        ],
        partialTail: 'invalid',
      });
    });

    it('should repack file with recovered data', async () => {
      const sink = new FileSink({
        filePath: testFile,
        recover: () => stringRecover(testFile, (line: string) => line),
      });

      // Write initial data
      sink.open();
      testData.forEach(item => sink.write(item));
      sink.close();

      // Repack to the same file
      sink.repack();

      // Verify the content is still correct
      const fileContent = fs.readFileSync(testFile, 'utf8');
      const lines = fileContent
        .trim()
        .split('\n')
        .filter(line => line.length > 0);
      expect(lines).toStrictEqual(testData);
    });

    it('should repack file to different output path', async () => {
      const outputPath = path.join(baseDir, 'repacked.txt');
      const sink = new FileSink({
        filePath: testFile,
        recover: () => stringRecover(testFile, (line: string) => line),
      });

      // Write initial data
      sink.open();
      testData.forEach(item => sink.write(item));
      sink.close();

      // Repack to different file
      sink.repack(outputPath);

      // Verify the original file is unchanged
      expect(fs.existsSync(testFile)).toBe(true);

      // Verify the repacked file has correct content
      expect(fs.existsSync(outputPath)).toBe(true);
      const fileContent = fs.readFileSync(outputPath, 'utf8');
      const lines = fileContent
        .trim()
        .split('\n')
        .filter(line => line.length > 0);
      expect(lines).toStrictEqual(testData);
    });

    it('should call finalize function when provided', async () => {
      let finalized = false;
      const sink = new FileSink({
        filePath: testFile,
        recover: () => stringRecover(testFile, (line: string) => line),
        finalize: () => {
          finalized = true;
        },
      });

      sink.finalize();
      expect(finalized).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty files', async () => {
      fs.writeFileSync(testFile, '');

      expect(stringRecover(testFile, (line: string) => line)).toStrictEqual({
        records: [],
        errors: [],
        partialTail: null,
      });
    });

    it('should handle files with only whitespace', async () => {
      fs.writeFileSync(testFile, '   \n  \n\t\n');

      expect(stringRecover(testFile, (line: string) => line)).toStrictEqual({
        records: [],
        errors: [],
        partialTail: null,
      });
    });

    it('should handle non-existent files', async () => {
      const nonExistentFile = path.join(baseDir, 'does-not-exist.txt');

      expect(
        stringRecover(nonExistentFile, (line: string) => line),
      ).toStrictEqual({
        records: [],
        errors: [],
        partialTail: null,
      });
    });
  });
});
