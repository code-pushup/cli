import { rm } from 'node:fs/promises';
import path from 'node:path';
import {
  executeProcess,
  isVerbose,
  readJsonFile,
  stringifyError,
} from '@code-pushup/utils';
import type { CommandContext } from '../context.js';

export async function runPrintConfig({
  bin,
  config,
  directory,
  project,
  observer,
}: CommandContext): Promise<unknown> {
  // unique file name per project so command can be run in parallel
  const outputFile = ['code-pushup', 'config', project, 'json']
    .filter(Boolean)
    .join('.');
  const outputPath =
    project && directory === process.cwd()
      ? // cache-friendly path for Nx projects (assuming {workspaceRoot}/.code-pushup/{projectName})
        path.join(process.cwd(), '.code-pushup', project, outputFile)
      : // absolute path
        path.resolve(directory, '.code-pushup', outputFile);

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
