import { ESLint, Linter } from 'eslint';
import { ESLintPluginConfig } from '../config';
import { lint } from './lint';

class MockESLint {
  lintFiles = vi.fn().mockResolvedValue([
    {
      filePath: `${process.cwd()}/src/app/app.component.ts`,
      messages: [
        { ruleId: 'max-lines' },
        { ruleId: '@typescript-eslint/no-explicit-any' },
        { ruleId: '@typescript-eslint/no-explicit-any' },
      ],
    },
    {
      filePath: `${process.cwd()}/src/app/app.component.spec.ts`,
      messages: [
        { ruleId: 'max-lines' },
        { ruleId: '@typescript-eslint/no-explicit-any' },
      ],
    },
    {
      filePath: `${process.cwd()}/src/app/pages/settings.component.ts`,
      messages: [{ ruleId: 'max-lines' }],
    },
  ] as ESLint.LintResult[]);

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
      } as Linter.Config),
  );
}

let eslint: MockESLint;

vi.mock('eslint', () => ({
  ESLint: vi.fn().mockImplementation(() => {
    eslint = new MockESLint();
    return eslint;
  }),
}));

describe('lint', () => {
  const config: ESLintPluginConfig = {
    eslintrc: '.eslintrc.js',
    patterns: ['**/*.js'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add relativeFilePath to each lint result', async () => {
    const { results } = await lint(config);
    expect(results).toEqual([
      expect.objectContaining({ relativeFilePath: 'src/app/app.component.ts' }),
      expect.objectContaining({
        relativeFilePath: 'src/app/app.component.spec.ts',
      }),
      expect.objectContaining({
        relativeFilePath: 'src/app/pages/settings.component.ts',
      }),
    ]);
  });

  it('should get rule options for each file', async () => {
    const { ruleOptionsPerFile } = await lint(config);
    expect(ruleOptionsPerFile).toEqual({
      'src/app/app.component.ts': {
        'max-lines': [500],
        '@typescript-eslint/no-explicit-any': [],
      },
      'src/app/pages/settings.component.ts': {
        'max-lines': [500],
      },
      'src/app/app.component.spec.ts': {
        'max-lines': [800],
        '@typescript-eslint/no-explicit-any': [],
      },
    });
  });

  it('should correctly use ESLint Node API', async () => {
    await lint(config);
    expect(ESLint).toHaveBeenCalledWith<ConstructorParameters<typeof ESLint>>({
      overrideConfigFile: '.eslintrc.js',
      useEslintrc: false,
      errorOnUnmatchedPattern: false,
    });
    expect(eslint.lintFiles).toHaveBeenCalledTimes(1);
    expect(eslint.lintFiles).toHaveBeenCalledWith(['**/*.js']);
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
