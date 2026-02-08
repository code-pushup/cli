import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { threadId } from 'node:worker_threads';
import type { RunnerFilesPaths } from '@code-pushup/models';
import { ensureDirectoryExists, pluginWorkDir } from './file-system.js';

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
  // Use timestamp + process ID + threadId
  // This prevents race conditions when running the same plugin for multiple projects in parallel
  const uniqueId = `${(performance.timeOrigin + performance.now()) * 10}-${process.pid}-${threadId}`;
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
