import { describe, expect, it } from 'vitest';
import type { RunnerConfig } from '@code-pushup/models';
import { readJsonFile, removeDirectoryIfExists } from '@code-pushup/utils';
import type { FinalJSPackagesPluginConfig } from '../config.js';
import { defaultAuditLevelMapping } from '../constants.js';
import { PLUGIN_CONFIG_PATH, WORKDIR } from './constants.js';
import { createRunnerConfig } from './index.js';

describe('createRunnerConfig', () => {
  it('should create a valid runner config', async () => {
    const runnerConfig = await createRunnerConfig('executeRunner.ts', {
      packageManager: 'npm',
      checks: ['audit'],
      auditLevelMapping: defaultAuditLevelMapping,
      dependencyGroups: ['prod', 'dev'],
      packageJsonPaths: ['package.json'],
    });
    expect(runnerConfig).toStrictEqual<RunnerConfig>({
      command: 'node',
      args: ['"executeRunner.ts"'],
      outputFile: expect.stringContaining('runner-output.json'),
    });
  });

  it('should provide plugin config to runner in JSON file', async () => {
    await removeDirectoryIfExists(WORKDIR);
    const pluginConfig: FinalJSPackagesPluginConfig = {
      packageManager: 'yarn-classic',
      checks: ['outdated'],
      dependencyGroups: ['prod', 'dev'],
      auditLevelMapping: { ...defaultAuditLevelMapping, moderate: 'error' },
      packageJsonPaths: ['package.json'],
    };
    await createRunnerConfig('executeRunner.ts', pluginConfig);
    const config =
      await readJsonFile<FinalJSPackagesPluginConfig>(PLUGIN_CONFIG_PATH);
    expect(config).toStrictEqual(pluginConfig);
  });
});
