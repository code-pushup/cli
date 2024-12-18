import { writeFile } from 'node:fs/promises';
import { describe, it } from 'vitest';
import type { AuditOutputs, RunnerConfig } from '@code-pushup/models';
import { readJsonFile, removeDirectoryIfExists } from '@code-pushup/utils';
import type { DocCoveragePluginConfig } from '../config.js';
import {
  PLUGIN_CONFIG_PATH,
  RUNNER_OUTPUT_PATH,
  WORKDIR,
} from './constants.js';
import { createRunnerConfig, executeRunner } from './index.js';

describe('createRunnerConfig', () => {
  it('should create a valid runner config', async () => {
    const runnerConfig = await createRunnerConfig('executeRunner.ts', {
      sourceGlob: 'src/**/*.ts',
    });
    expect(runnerConfig).toStrictEqual<RunnerConfig>({
      command: 'node',
      args: ['"executeRunner.ts"'],
      outputFile: expect.stringContaining('runner-output.json'),
    });
  });

  it('should provide plugin config to runner in JSON file', async () => {
    await removeDirectoryIfExists(WORKDIR);

    const pluginConfig: DocCoveragePluginConfig = {
      sourceGlob: 'src/**/*.ts',
    };

    await createRunnerConfig('executeRunner.ts', pluginConfig);

    const config =
      await readJsonFile<DocCoveragePluginConfig>(PLUGIN_CONFIG_PATH);
    expect(config).toStrictEqual(pluginConfig);
  });
});

describe('executeRunner', () => {
  it(
    'should successfully execute runner',
    {
      timeout: 60 * 1000,
    },
    async () => {
      const config: DocCoveragePluginConfig = {
        sourceGlob: 'packages/plugin-doc-coverage/mocks/*.ts',
      };

      await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));
      await executeRunner();

      const results = await readJsonFile<AuditOutputs>(RUNNER_OUTPUT_PATH);
      expect(results).toBeDefined();
    },
  );
});
