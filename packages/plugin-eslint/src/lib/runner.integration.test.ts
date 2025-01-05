import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type MockInstance, describe, expect, it } from 'vitest';
import type { AuditOutput, AuditOutputs, Issue } from '@code-pushup/models';
import { osAgnosticAuditOutputs } from '@code-pushup/test-utils';
import { readJsonFile } from '@code-pushup/utils';
import type { ESLintTarget } from './config.js';
import { listAuditsAndGroups } from './meta/index.js';
import {
  RUNNER_OUTPUT_PATH,
  createRunnerConfig,
  executeRunner,
} from './runner/index.js';

describe('executeRunner', () => {
  let cwdSpy: MockInstance<[], string>;
  let platformSpy: MockInstance<[], NodeJS.Platform>;

  const createPluginConfig = async (eslintrc: ESLintTarget['eslintrc']) => {
    const patterns = ['src/**/*.js', 'src/**/*.jsx'];
    const targets: ESLintTarget[] = [{ eslintrc, patterns }];
    const { audits } = await listAuditsAndGroups(targets);
    await createRunnerConfig('bin.js', audits, targets);
  };

  const appDir = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '..',
    '..',
    'mocks',
    'fixtures',
    'todos-app',
  );

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(appDir);
    // Windows does not require additional quotation marks for globs
    platformSpy = vi.spyOn(os, 'platform').mockReturnValue('win32');
  });

  afterAll(() => {
    cwdSpy.mockRestore();
    platformSpy.mockRestore();
  });

  it('should execute ESLint and create audit results for React application', async () => {
    await createPluginConfig('eslint.config.js');
    await executeRunner();

    const json = await readJsonFile<AuditOutputs>(RUNNER_OUTPUT_PATH);
    expect(osAgnosticAuditOutputs(json)).toMatchSnapshot();
  });

  it('should execute runner with custom config using @code-pushup/eslint-config', async () => {
    await createPluginConfig('code-pushup.eslint.config.mjs');
    await executeRunner();

    const json = await readJsonFile<AuditOutput[]>(RUNNER_OUTPUT_PATH);
    // expect warnings from unicorn/filename-case rule from default config
    expect(json).toContainEqual(
      expect.objectContaining<Partial<AuditOutput>>({
        slug: 'unicorn-filename-case',
        displayValue: expect.stringMatching(/^\d+ warnings?$/),
        details: {
          issues: expect.arrayContaining<Issue>([
            {
              severity: 'warning',
              message:
                'Filename is not in kebab case. Rename it to `use-todos.js`.',
              source: expect.objectContaining<Issue['source']>({
                file: path.join(appDir, 'src', 'hooks', 'useTodos.js'),
              }),
            },
          ]),
        },
      }),
    );
  }, 18_000);
});
