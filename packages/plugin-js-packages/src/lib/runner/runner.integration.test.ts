import { describe, expect, it } from 'vitest';
import type { RunnerConfig } from '@code-pushup/models';
import { readJsonFile } from '@code-pushup/utils';
import type { FinalJSPackagesPluginConfig } from '../config.js';
import { defaultAuditLevelMapping } from '../constants.js';
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
      args: [
        '"executeRunner.ts"',
        expect.stringContaining('plugin-config.json'),
        expect.stringContaining('runner-output.json'),
      ],
      outputFile: expect.stringContaining('runner-output.json'),
      configFile: expect.stringContaining('plugin-config.json'),
    });
  });

  it('should provide plugin config to runner in JSON file', async () => {
    const pluginConfig: FinalJSPackagesPluginConfig = {
      packageManager: 'yarn-classic',
      checks: ['outdated'],
      dependencyGroups: ['prod', 'dev'],
      auditLevelMapping: { ...defaultAuditLevelMapping, moderate: 'error' },
      packageJsonPaths: ['package.json'],
    };
    const { configFile } = await createRunnerConfig(
      'executeRunner.ts',
      pluginConfig,
    );
    expect(configFile).toMatch(/.*plugin-config\.json$/);
    const config = await readJsonFile<FinalJSPackagesPluginConfig>(configFile!);
    expect(config).toStrictEqual(pluginConfig);
  });
});
