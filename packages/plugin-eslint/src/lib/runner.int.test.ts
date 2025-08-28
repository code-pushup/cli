import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { type MockInstance, describe, expect, it } from 'vitest';
import type {
  Audit,
  AuditOutput,
  AuditOutputs,
  Issue,
} from '@code-pushup/models';
import { osAgnosticAuditOutputs } from '@code-pushup/test-utils';
import type { ESLintTarget } from './config.js';
import { listAuditsAndGroups } from './meta/index.js';
import { createRunnerFunction } from './runner/index.js';

describe('executeRunner', () => {
  let cwdSpy: MockInstance<[], string>;
  let platformSpy: MockInstance<[], NodeJS.Platform>;

  const createAudits = async (
    eslintrc: ESLintTarget['eslintrc'],
  ): Promise<Audit[]> => {
    const patterns = ['src/**/*.js', 'src/**/*.jsx'];
    const targets: ESLintTarget[] = [{ eslintrc, patterns }];
    const { audits } = await listAuditsAndGroups(targets);
    return audits;
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
    const eslintTarget = 'eslint.config.js';
    const runnerFn = await createRunnerFunction({
      audits: await createAudits(eslintTarget),
      targets: [
        {
          eslintrc: eslintTarget,
          patterns: '.',
        },
      ],
    });
    const res: AuditOutputs = await runnerFn({ outputDir: '' });
    expect(osAgnosticAuditOutputs(res)).toMatchSnapshot();
  });

  it.skipIf(process.platform === 'win32')(
    'should execute runner with custom config using @code-pushup/eslint-config',
    async () => {
      const eslintTarget = 'code-pushup.eslint.config.mjs';
      const runnerFn = await createRunnerFunction({
        audits: await createAudits(eslintTarget),
        targets: [
          {
            eslintrc: eslintTarget,
            patterns: '.',
          },
        ],
      });

      const json = await runnerFn({ outputDir: '' });
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
