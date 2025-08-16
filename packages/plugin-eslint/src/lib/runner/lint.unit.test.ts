import { ESLint, type Linter } from 'eslint';
import { expect } from 'vitest';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { executeProcess } from '@code-pushup/utils';
import type { ESLintPluginConfig } from '../config.js';
import { lint } from './lint.js';

class MockESLint {
  calculateConfigForFile = vi.fn().mockImplementation(
    (path: string) =>
      ({
        rules: path.endsWith('.spec.ts')
          ? {
              'max-lines': ['warn', 800],
              '@typescript-eslint/no-explicit-any': 'warn',
            }
          : {
              'max-lines': ['warn', 500],
              '@typescript-eslint/no-explicit-any': 'error',
            },
      }) as Linter.Config,
  );
}

let eslint: MockESLint;

vi.mock('eslint', () => ({
  ESLint: vi.fn().mockImplementation(() => {
    eslint = new MockESLint();
    return eslint;
  }),
}));

vi.mock('@code-pushup/utils', async () => {
  const utils = await vi.importActual('@code-pushup/utils');
  const testUtils: { MEMFS_VOLUME: string } = await vi.importActual(
    '@code-pushup/test-utils',
  );
  const cwd = testUtils.MEMFS_VOLUME;
  return {
    ...utils,
    readJsonFile: vi.fn(
      (_: string) =>
        // Return the ESLint.LintResult[] array that readJsonFile should return
        [
          {
            filePath: `${cwd}/src/app/app.component.ts`,
            messages: [
              { ruleId: 'max-lines' },
              { ruleId: '@typescript-eslint/no-explicit-any' },
              { ruleId: '@typescript-eslint/no-explicit-any' },
            ],
          },
          {
            filePath: `${cwd}/src/app/app.component.spec.ts`,
            messages: [
              { ruleId: 'max-lines' },
              { ruleId: '@typescript-eslint/no-explicit-any' },
            ],
          },
          {
            filePath: `${cwd}/src/app/pages/settings.component.ts`,
            messages: [{ ruleId: 'max-lines' }],
          },
        ] as ESLint.LintResult[],
    ),
    executeProcess: vi.fn(async () => ({
      stdout: JSON.stringify([
        {
          filePath: `${cwd}/src/app/app.component.ts`,
          messages: [
            { ruleId: 'max-lines' },
            { ruleId: '@typescript-eslint/no-explicit-any' },
            { ruleId: '@typescript-eslint/no-explicit-any' },
          ],
        },
        {
          filePath: `${cwd}/src/app/app.component.spec.ts`,
          messages: [
            { ruleId: 'max-lines' },
            { ruleId: '@typescript-eslint/no-explicit-any' },
          ],
        },
        {
          filePath: `${cwd}/src/app/pages/settings.component.ts`,
          messages: [{ ruleId: 'max-lines' }],
        },
      ] as ESLint.LintResult[]),
    })),
  };
});

describe('lint', () => {
  const config: ESLintPluginConfig = {
    eslintrc: '.eslintrc.js',
    patterns: ['**/*.js'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get rule options for each file', async () => {
    const { ruleOptionsPerFile } = await lint(config);
    expect(ruleOptionsPerFile).toStrictEqual({
      [`${process.cwd()}/src/app/app.component.ts`]: {
        'max-lines': [500],
        '@typescript-eslint/no-explicit-any': [],
      },
      [`${process.cwd()}/src/app/pages/settings.component.ts`]: {
        'max-lines': [500],
      },
      [`${process.cwd()}/src/app/app.component.spec.ts`]: {
        'max-lines': [800],
        '@typescript-eslint/no-explicit-any': [],
      },
    });
  });

  it('should correctly use ESLint CLI and Node API', async () => {
    await lint(config);
    expect(ESLint).toHaveBeenCalledWith<ConstructorParameters<typeof ESLint>>({
      overrideConfigFile: '.eslintrc.js',
      errorOnUnmatchedPattern: false,
    });

    expect(executeProcess).toHaveBeenCalledOnce();
    expect(executeProcess).toHaveBeenCalledWith<
      Parameters<typeof executeProcess>
    >({
      command: 'npx',
      args: [
        'eslint',
        '--config=".eslintrc.js"',
        '--no-error-on-unmatched-pattern',
        '--format=json',
        expect.stringMatching(/--output-file=.*eslint-report\.\d+\.json/),
        "'**/*.js'", // wraps in quotes on Unix
      ],
      ignoreExitCode: true,
      cwd: '/test',
    });

    expect(eslint.calculateConfigForFile).toHaveBeenCalledTimes(3);
    expect(eslint.calculateConfigForFile).toHaveBeenCalledWith(
      `${process.cwd()}/src/app/app.component.ts`,
    );
    expect(eslint.calculateConfigForFile).toHaveBeenCalledWith(
      `${process.cwd()}/src/app/app.component.spec.ts`,
    );
    expect(eslint.calculateConfigForFile).toHaveBeenCalledWith(
      `${process.cwd()}/src/app/pages/settings.component.ts`,
    );
  });
});
