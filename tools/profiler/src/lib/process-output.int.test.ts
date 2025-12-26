import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createProcessOutput } from './process-output';

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

describe('ProcessOutput Integration Tests', () => {
  const testDir = path.join('tmp', 'unit-test', 'profiler');
  const testFile = (name = 'out') => path.join(testDir, `${name}.jsonl`);

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist, ignore
    }
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory after each test
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should write buffered lines to file and flush', async () => {
    const filePath = testFile('buffered-write');
    const output = createProcessOutput({
      filePath,
      flushEveryN: 2,
    });

    output.writeLine({ test: 1 });
    output.writeLine({ test: 2 });

    output.close();

    expect(await jsonFromJsonl(filePath)).toStrictEqual([
      { test: 1 },
      { test: 2 },
    ]);
  });

  it('should write lines immediately without buffering', async () => {
    const filePath = testFile('immediate-write');
    const output = createProcessOutput({
      filePath,
      flushEveryN: 10,
    });

    output.writeLineImmediate({ id: 1, message: 'immediate' });
    output.writeLineImmediate({ id: 2, message: 'also immediate' });

    output.close();

    await expect(jsonFromJsonl(filePath)).resolves.toStrictEqual([
      { id: 1, message: 'immediate' },
      { id: 2, message: 'also immediate' },
    ]);
  });
});
