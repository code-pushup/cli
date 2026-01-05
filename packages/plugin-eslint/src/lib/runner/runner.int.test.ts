import { cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { type MockInstance, describe, expect, it } from 'vitest';
import {
  type Audit,
  type AuditOutput,
  type AuditOutputs,
  DEFAULT_PERSIST_CONFIG,
  type Issue,
} from '@code-pushup/models';
import { osAgnosticAuditOutputs } from '@code-pushup/test-fixtures';
import {
  restoreNxIgnoredFiles,
  teardownTestFolder,
} from '@code-pushup/test-utils';
import type { ESLintTarget } from '../config.js';
import { listAuditsAndGroups } from '../meta/list.js';
import { createRunnerFunction } from './runner.js';

describe('executeRunner', () => {
  let cwdSpy: MockInstance<[], string>;
  let platformSpy: MockInstance<[], NodeJS.Platform>;

  const prepareRunnerArgs = async (
    eslintrc: ESLintTarget['eslintrc'],
  ): Promise<{ audits: Audit[]; targets: ESLintTarget[] }> => {
    const patterns = ['src/**/*.js', 'src/**/*.jsx'];
    const targets: ESLintTarget[] = [{ eslintrc, patterns }];
    const { audits } = await listAuditsAndGroups(targets);
    return { audits, targets };
  };

  const thisDir = fileURLToPath(path.dirname(import.meta.url));
  const fixturesDir = path.join(thisDir, '..', '..', '..', 'mocks', 'fixtures');
  const tmpDir = path.join(process.cwd(), 'tmp', 'int', 'plugin-eslint');
  const appDir = path.join(tmpDir, 'todos-app');

  beforeAll(async () => {
    await cp(path.join(fixturesDir, 'todos-app'), appDir, {
      recursive: true,
    });
    await restoreNxIgnoredFiles(appDir);
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(appDir);
    // Windows does not require additional quotation marks for globs
    platformSpy = vi.spyOn(os, 'platform').mockReturnValue('win32');
  });

  afterAll(async () => {
    cwdSpy.mockRestore();
    platformSpy.mockRestore();
    await teardownTestFolder(tmpDir);
  });

  it('should execute ESLint and create audit results for React application', async () => {
    const args = await prepareRunnerArgs('eslint.config.js');
    const runnerFn = createRunnerFunction(args);
    const res = (await runnerFn({
      persist: DEFAULT_PERSIST_CONFIG,
    })) as AuditOutputs;
    expect(osAgnosticAuditOutputs(res)).toMatchSnapshot();
  });

  it.skipIf(process.platform === 'win32')(
    'should execute runner with custom config using @code-pushup/eslint-config',
    async () => {
      const eslintTarget = 'code-pushup.eslint.config.mjs';
      const runnerFn = createRunnerFunction({
        ...(await prepareRunnerArgs(eslintTarget)),
      });

      const json = await runnerFn({ persist: DEFAULT_PERSIST_CONFIG });
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
    },
  );
}, 20_000);
