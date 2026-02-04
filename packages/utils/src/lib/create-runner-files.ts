import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RunnerFilesPaths } from '@code-pushup/models';
import { ensureDirectoryExists, pluginWorkDir } from './file-system.js';
import { getUniqueProcessThreadId } from './process-id.js';

/**
 * Function to create timestamp nested plugin runner files for config and output.
 *
 * @param pluginSlug - slug of the plugin name used as folder names to group same plugin configs
 * @param configJSON - config of the plugin runner as JSON.
 */
export async function createRunnerFiles(
  pluginSlug: string,
  configJSON: string,
): Promise<RunnerFilesPaths> {
  const uniqueId = getUniqueProcessThreadId();
  const runnerWorkDir = path.join(pluginWorkDir(pluginSlug), uniqueId);
  const runnerConfigPath = path.join(runnerWorkDir, 'plugin-config.json');
  const runnerOutputPath = path.join(runnerWorkDir, 'runner-output.json');

  await ensureDirectoryExists(path.dirname(runnerOutputPath));
  await writeFile(runnerConfigPath, configJSON);

  return {
    runnerConfigPath,
    runnerOutputPath,
  };
}
