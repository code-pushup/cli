import { writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { RunnerConfig } from '@code-pushup/models';
import { ensureDirectoryExists } from '@code-pushup/utils';
import { FinalJSPackagesPluginConfig } from '../config';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH } from './constants';

export function executeRunner(): void {
  return;
}

export async function createRunnerConfig(
  scriptPath: string,
  config: FinalJSPackagesPluginConfig,
): Promise<RunnerConfig> {
  await ensureDirectoryExists(dirname(PLUGIN_CONFIG_PATH));
  await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));

  return {
    command: 'node',
    args: [scriptPath],
    outputFile: RUNNER_OUTPUT_PATH,
  };
}
