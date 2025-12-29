import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLineOutput } from './line-output';

const jsonFromJsonl = async (
  filePath: string,
): Promise<Record<string, unknown>[]> => {
  const jsonl = await fs.readFile(filePath, 'utf8');
  const lines = jsonl
    .trim()
    .split('\n')
    .filter(line => line.trim() !== '');
  return JSON.parse(`[${lines.join(',')}]`);
};

describe('LineOutput Integration Tests', () => {
  const getTestDir = (testName: string) => {
    const sanitizedName = testName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return path.join('tmp', 'int', 'profiler', sanitizedName);
  };

  let currentTestDir: string;

  beforeEach(async () => {
    // Create test-specific directory
    currentTestDir = getTestDir(
      expect.getState().currentTestName || 'unknown-test',
    );
    await fs.mkdir(currentTestDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(currentTestDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should write plain text lines without JSON encoding', async () => {
    const filePath = path.join(currentTestDir, `logs.txt`);
    const output = createLineOutput({
      filePath,
    });

    output.writeLine('This is a plain text log entry');
    output.writeLine('Another plain text line');
    output.writeLine('Final log message');

    output.close();

    const content = await fs.readFile(filePath, 'utf8');
    expect(content.trim()).toBe(
      'This is a plain text log entry\nAnother plain text line\nFinal log message',
    );
  });

  it('should write jsonl lines with custom structured encoding', async () => {
    const filePath = path.join(currentTestDir, `logs.jsonl`);
    const output = createLineOutput({
      filePath,
      encode: (obj: { timestamp: string; level: string; message: string }) =>
        JSON.stringify(obj),
      parse: (line: string) => JSON.parse(line),
    });

    output.writeLine({
      timestamp: '2025-12-29T10:00:00',
      level: 'INFO',
      message: 'Application started',
    });
    output.writeLine({
      timestamp: '2025-12-29T10:01:00',
      level: 'ERROR',
      message: 'Database connection failed',
    });

    output.close();

    const content = await fs.readFile(filePath, 'utf8');
    const lines = content
      .trim()
      .split('\n')
      .map(line => JSON.parse(line));
    expect(lines).toStrictEqual([
      {
        timestamp: '2025-12-29T10:00:00',
        level: 'INFO',
        message: 'Application started',
      },
      {
        timestamp: '2025-12-29T10:01:00',
        level: 'ERROR',
        message: 'Database connection failed',
      },
    ]);
  });

  it('should recover from corrupted lines in existing jsonl file', async () => {
    const filePath = path.join(currentTestDir, 'recovery-test.jsonl');

    // Stage a file with valid JSON lines and one corrupted line at the end
    const validLines = [
      JSON.stringify({ id: 1, message: 'Valid line 1' }),
      JSON.stringify({ id: 2, message: 'Valid line 2' }),
    ];
    const corruptedContent = validLines.join('\n') + '\n{"incomplete": json}';
    await fs.writeFile(filePath, corruptedContent);

    // Create LineOutput which automatically recovers during initialization
    const output = createLineOutput({
      filePath,
      encode: (obj: any) => JSON.stringify(obj),
      parse: (line: string) => JSON.parse(line),
      onRecoverSkip: (line: string, error: unknown) => {
        // Verify that the corrupted line is being skipped
        expect(line.trim()).toBe('{"incomplete": json}');
      },
    });

    // Write new valid data
    output.writeLine({ id: 3, message: 'New valid line after recovery' });
    output.close();

    // Verify that only valid lines remain (corrupted ones were truncated)
    const finalContent = await fs.readFile(filePath, 'utf8');
    const finalLines = finalContent
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    expect(finalLines).toStrictEqual([
      { id: 1, message: 'Valid line 1' },
      { id: 2, message: 'Valid line 2' },
      { id: 3, message: 'New valid line after recovery' },
    ]);
  });
});
