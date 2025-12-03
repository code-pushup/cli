import path from 'node:path';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import type { CommandContext } from '../context.js';
import { executeCliCommand } from '../exec.js';

export async function runMergeDiffs(
  files: string[],
  context: CommandContext,
): Promise<string> {
  const outputDir = path.join(context.directory, DEFAULT_PERSIST_OUTPUT_DIR);
  const filename = `merged-${DEFAULT_PERSIST_FILENAME}`;

  await executeCliCommand(
    [
      'merge-diffs',
      ...files.map(file => `--files=${file}`),
      `--persist.outputDir=${outputDir}`,
      `--persist.filename=${filename}`,
    ],
    context,
  );

  return path.join(outputDir, `${filename}-diff.md`);
}
