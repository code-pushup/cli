import { rm } from 'node:fs/promises';
import path from 'node:path';
import {
  executeProcess,
  generateRandomId,
  isVerbose,
  readJsonFile,
  stringifyError,
} from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runPrintConfig({
  bin,
  config,
  directory,
  observer,
}: CommandContext): Promise<unknown> {
  // random file name so command can be run in parallel
  const outputFile = `code-pushup.${generateRandomId()}.config.json`;
  const outputPath = path.resolve(directory, outputFile);

  await executeProcess({
    command: bin,
    args: [
      ...(config ? [`--config=${config}`] : []),
      'print-config',
      ...(isVerbose() ? ['--verbose'] : []),
      `--output=${outputPath}`,
    ],
    cwd: directory,
    observer,
  });

  try {
    const content = await readJsonFile(outputPath);
    await rm(outputPath);
    return content;
  } catch (error) {
    throw new Error(
      `Error parsing output of print-config command - ${stringifyError(error)}`,
    );
  }
}
