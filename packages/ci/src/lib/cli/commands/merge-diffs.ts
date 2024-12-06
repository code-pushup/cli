import { join } from 'node:path';
import {
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_OUTPUT_DIR,
} from '@code-pushup/models';
import { executeProcess } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runMergeDiffs(
  files: string[],
  { bin, config, directory, silent }: CommandContext,
): Promise<string> {
  const outputDir = join(directory, DEFAULT_PERSIST_OUTPUT_DIR);
  const filename = `merged-${DEFAULT_PERSIST_FILENAME}`;

  const { stdout } = await executeProcess({
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
  if (!silent) {
    console.info(stdout);
  }

  return join(outputDir, `${filename}-diff.md`);
}
