import path from 'node:path';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runMergeDiffs(
  files: string[],
  { bin, config, directory }: CommandContext,
): Promise<string> {
  const outputDir = path.join(directory, DEFAULT_PERSIST_OUTPUT_DIR);
  const filename = `merged-${DEFAULT_PERSIST_FILENAME}`;

  await executeProcess({
    command: bin,
    args: [
      'merge-diffs',
      ...files.map(file => `--files=${file}`),
      ...(config ? [`--config=${config}`] : []),
      `--persist.outputDir=${outputDir}`,
      `--persist.filename=${filename}`,
    ],
    cwd: directory,
  });

  return path.join(outputDir, `${filename}-diff.md`);
}
