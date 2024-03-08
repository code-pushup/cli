import { ESLint } from 'eslint';
import { rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MockInstance, describe, expect, it } from 'vitest';
import type { AuditOutput, AuditOutputs, Issue } from '@code-pushup/models';
import { osAgnosticAuditOutputs } from '@code-pushup/test-utils';
import { ensureDirectoryExists, readJsonFile } from '@code-pushup/utils';
import { listAuditsAndGroups } from './meta';
import {
  ESLINTRC_PATH,
  PLUGIN_CONFIG_PATH,
  RUNNER_OUTPUT_PATH,
  createRunnerConfig,
  executeRunner,
} from './runner';
import { setupESLint } from './setup';

describe('executeRunner', () => {
  let cwdSpy: MockInstance<[], string>;
  let platformSpy: MockInstance<[], NodeJS.Platform>;

  const createPluginConfig = async (eslintrc: string) => {
    const patterns = ['src/**/*.js', 'src/**/*.jsx'];
    const eslint = setupESLint(eslintrc);
    const { audits } = await listAuditsAndGroups(eslint, patterns);
    await createRunnerConfig('bin.js', audits, eslintrc, patterns);
  };

  const appDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    'mocks',
    'fixtures',
    'todos-app',
  );

  beforeAll(async () => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(appDir);
    // Windows does not require additional quotation marks for globs
    platformSpy = vi.spyOn(os, 'platform').mockReturnValue('win32');

    const config: ESLint.ConfigData = {
      extends: '@code-pushup',
    };
    await ensureDirectoryExists(dirname(ESLINTRC_PATH));
    await writeFile(ESLINTRC_PATH, JSON.stringify(config));
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    platformSpy.mockRestore();

    await rm(ESLINTRC_PATH, { force: true });
    await rm(PLUGIN_CONFIG_PATH, { force: true });
  });

  it('should execute ESLint and create audit results for React application', async () => {
    await createPluginConfig('.eslintrc.js');
    await executeRunner();

    const json = await readJsonFile<AuditOutputs>(RUNNER_OUTPUT_PATH);
    expect(osAgnosticAuditOutputs(json)).toMatchSnapshot();
  });

  it('should execute runner with inline config using @code-pushup/eslint-config', async () => {
    await createPluginConfig(ESLINTRC_PATH);
    await executeRunner();

    const json = await readJsonFile<AuditOutput[]>(RUNNER_OUTPUT_PATH);
    // expect warnings from unicorn/filename-case rule from default config
    expect(json).toContainEqual(
      expect.objectContaining<Partial<AuditOutput>>({
        slug: 'unicorn-filename-case',
        displayValue: '5 warnings',
        details: {
          issues: expect.arrayContaining<Issue>([
            {
              severity: 'warning',
              message:
                'Filename is not in kebab case. Rename it to `use-todos.js`.',
              source: expect.objectContaining<Issue['source']>({
                file: join(appDir, 'src', 'hooks', 'useTodos.js'),
              }),
            },
          ]),
        },
      }),
    );
  }, 7000);
});
