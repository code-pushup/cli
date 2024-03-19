import { rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MockInstance, describe, expect, it } from 'vitest';
import { AuditOutputs, RunnerConfig } from '@code-pushup/models';
import {
  ensureDirectoryExists,
  readJsonFile,
  removeDirectoryIfExists,
} from '@code-pushup/utils';
import { createRunnerConfig, executeRunner } from '.';
import { FinalJSPackagesPluginConfig } from '../config';
import { defaultAuditLevelMapping } from '../constants';
import { PLUGIN_CONFIG_PATH, RUNNER_OUTPUT_PATH, WORKDIR } from './constants';

describe('executeRunner', () => {
  let cwdSpy: MockInstance<[], string>;
  const appDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    '..',
    '..',
    '..',
    'examples',
    'react-todos-app',
  );

  beforeAll(async () => {
    await ensureDirectoryExists(dirname(PLUGIN_CONFIG_PATH));
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(appDir);
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    await rm(PLUGIN_CONFIG_PATH, { force: true });
  });

  it('should successfully execute runner for npm audit', async () => {
    const config: FinalJSPackagesPluginConfig = {
      packageManager: 'npm',
      checks: ['audit'],
      auditLevelMapping: defaultAuditLevelMapping,
    };
    await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));
    await executeRunner();
    const results = await readJsonFile<AuditOutputs>(RUNNER_OUTPUT_PATH);
    expect(results).toMatchSnapshot();
  });

  it('should successfully execute runnerfor npm outdated', async () => {
    const config: FinalJSPackagesPluginConfig = {
      packageManager: 'npm',
      checks: ['outdated'],
      auditLevelMapping: defaultAuditLevelMapping,
    };
    await writeFile(PLUGIN_CONFIG_PATH, JSON.stringify(config));
    await executeRunner();
    const results = await readJsonFile<AuditOutputs>(RUNNER_OUTPUT_PATH);
    expect(results).toMatchSnapshot();
  });
}, 10_000);

describe('createRunnerConfig', () => {
  it('should create a valid runner config', async () => {
    const runnerConfig = await createRunnerConfig('executeRunner.ts', {
      packageManager: 'npm',
      checks: ['audit'],
      auditLevelMapping: defaultAuditLevelMapping,
    });
    expect(runnerConfig).toStrictEqual<RunnerConfig>({
      command: 'node',
      args: ['executeRunner.ts'],
      outputFile: expect.stringContaining('runner-output.json'),
    });
  });

  it('should provide plugin config to runner in JSON file', async () => {
    await removeDirectoryIfExists(WORKDIR);
    const pluginConfig: FinalJSPackagesPluginConfig = {
      packageManager: 'yarn-classic',
      checks: ['outdated'],
      auditLevelMapping: { ...defaultAuditLevelMapping, moderate: 'error' },
    };
    await createRunnerConfig('executeRunner.ts', pluginConfig);
    const config = await readJsonFile<FinalJSPackagesPluginConfig>(
      PLUGIN_CONFIG_PATH,
    );
    expect(config).toStrictEqual(pluginConfig);
  });
});
