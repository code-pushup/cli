import { rm } from 'node:fs/promises';
import path from 'node:path';
import { readJsonFile, stringifyError } from '@code-pushup/utils';
import type { CommandContext } from '../context.js';
import { executeCliCommand } from '../exec.js';

export async function runPrintConfig(
  context: CommandContext,
): Promise<unknown> {
  // unique file name per project so command can be run in parallel
  const outputFile = ['code-pushup', 'config', context.project, 'json']
    .filter(Boolean)
    .join('.');
  const outputPath =
    context.project && context.directory === process.cwd()
      ? // cache-friendly path for Nx projects (assuming {workspaceRoot}/.code-pushup/{projectName})
        path.join(process.cwd(), '.code-pushup', context.project, outputFile)
      : // absolute path
        path.resolve(context.directory, '.code-pushup', outputFile);

  await executeCliCommand(['print-config', `--output=${outputPath}`], context);

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
