import { ESLint } from 'eslint';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MockInstance, describe, expect, it } from 'vitest';
import type { AuditOutput, AuditOutputs, Issue } from '@code-pushup/models';
import { osAgnosticAuditOutputs } from '@code-pushup/test-utils';
import { readJsonFile } from '@code-pushup/utils';
import { listAuditsAndGroups } from './meta';
import {
  ESLINTRC_PATH,
  RUNNER_OUTPUT_PATH,
  createRunnerConfig,
  executeRunner,
} from './runner';
import { setupESLint } from './setup';

describe('executeRunner', () => {
  let cwdSpy: MockInstance<[], string>;
  let platformSpy: MockInstance<[], NodeJS.Platform>;

  const createArgv = async (eslintrc: string) => {
    const patterns = ['src/**/*.js', 'src/**/*.jsx'];
    const eslint = setupESLint(eslintrc);
    const { audits } = await listAuditsAndGroups(eslint, patterns);
    const runnerConfig = createRunnerConfig(
      'bin.js',
      audits,
      eslintrc,
      patterns,
    );
    return [runnerConfig.command, ...(runnerConfig.args ?? [])];
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
    await mkdir(dirname(ESLINTRC_PATH), { recursive: true });
    await writeFile(ESLINTRC_PATH, JSON.stringify(config));
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    platformSpy.mockRestore();

    await rm(ESLINTRC_PATH, { force: true });
  });

  it('should execute ESLint and create audit results for React application', async () => {
    const argv = await createArgv('.eslintrc.js');

    await executeRunner(argv);

    const json = await readJsonFile<AuditOutputs>(RUNNER_OUTPUT_PATH);
    expect(osAgnosticAuditOutputs(json)).toMatchSnapshot();
  });

  it('should execute runner with inline config using @code-pushup/eslint-config', async () => {
    const argv = await createArgv(ESLINTRC_PATH);

    await executeRunner(argv);

    const json = await readJsonFile<AuditOutput[]>(RUNNER_OUTPUT_PATH);
    // expect warnings from unicorn/filename-case rule from default config
    expect(json).toContainEqual(
      expect.objectContaining({
        slug: 'unicorn-filename-case',
        displayValue: '5 warnings',
        details: {
          issues: expect.arrayContaining([
            {
              severity: 'warning',
              message:
                'Filename is not in kebab case. Rename it to `use-todos.js`.',
              source: expect.objectContaining({
                file: join(appDir, 'src', 'hooks', 'useTodos.js'),
              } satisfies Partial<Issue['source']>),
            } satisfies Issue,
          ]),
        },
      } satisfies Partial<AuditOutput>),
    );
  }, 7000);
});
