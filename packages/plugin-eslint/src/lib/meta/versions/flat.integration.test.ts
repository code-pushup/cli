import type { ESLint, Linter, Rule } from 'eslint';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { RuleData } from '../parse.js';
import { loadRulesForFlatConfig } from './flat.js';

describe('loadRulesForFlatConfig', () => {
  const workDir = path.join(
    process.cwd(),
    'tmp',
    'plugin-eslint',
    'flat-config-tests',
  );

  beforeEach(async () => {
    vi.spyOn(process, 'cwd').mockReturnValue(workDir);
    await mkdir(workDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(workDir, { force: true, recursive: true });
  });

  it('should load built-in rules from implicit flat config location', async () => {
    const config: Linter.Config = {
      rules: {
        'no-unused-vars': 'error',
        'prefer-const': 'warn',
      },
    };
    await writeFile(
      path.join(workDir, 'eslint.config.js'),
      `export default ${JSON.stringify(config, null, 2)}`,
    );

    const expectedMeta = expect.objectContaining<Rule.RuleMetaData>({
      docs: expect.objectContaining<Rule.RuleMetaData['docs']>({
        description: expect.stringMatching(/\w+/),
        url: expect.stringContaining('https://eslint.org/'),
      }),
    });
    await expect(loadRulesForFlatConfig({})).resolves.toEqual([
      { ruleId: 'no-unused-vars', meta: expectedMeta, options: [] },
      { ruleId: 'prefer-const', meta: expectedMeta, options: [] },
    ] satisfies RuleData[]);
  });

  it('should load plugin rules from explicit flat config path', async () => {
    const tseslint = {
      rules: {
        'no-explicit-any': {
          meta: {
            docs: {
              description: 'Disallow the `any` type',
              url: 'https://typescript-eslint.io/rules/no-explicit-any/',
            },
          },
        } as Rule.RuleModule,
        'no-unsafe-call': {
          meta: {
            docs: {
              description: 'Disallow calling a value with type `any`',
              url: 'https://typescript-eslint.io/rules/no-unsafe-call/',
            },
          },
        } as Rule.RuleModule,
      },
    } as ESLint.Plugin;
    const reactHooks = {
      rules: {
        'rules-of-hooks': {
          meta: {
            docs: {
              description: 'enforces the Rules of Hooks',
              url: 'https://reactjs.org/docs/hooks-rules.html',
            },
          },
        } as Rule.RuleModule,
      },
    } as ESLint.Plugin;
    const config: Linter.Config[] = [
      {
        plugins: {
          '@typescript-eslint': tseslint,
        },
        rules: {
          '@typescript-eslint/no-explicit-any': 'error',
        },
      },
      {
        plugins: {
          'react-hooks': reactHooks,
        },
        rules: {
          'react-hooks/rules-of-hooks': 'error',
        },
      },
      {
        rules: {
          '@typescript-eslint/no-unsafe-call': 'error',
        },
      },
    ];
    await writeFile(
      path.join(workDir, 'code-pushup.eslint.config.js'),
      `export default ${JSON.stringify(config, null, 2)}`,
    );

    await expect(
      loadRulesForFlatConfig({ eslintrc: 'code-pushup.eslint.config.js' }),
    ).resolves.toEqual([
      {
        ruleId: '@typescript-eslint/no-explicit-any',
        meta: {
          docs: {
            description: 'Disallow the `any` type',
            url: 'https://typescript-eslint.io/rules/no-explicit-any/',
          },
        },
        options: [],
      },
      {
        ruleId: 'react-hooks/rules-of-hooks',
        meta: {
          docs: {
            description: 'enforces the Rules of Hooks',
            url: 'https://reactjs.org/docs/hooks-rules.html',
          },
        },
        options: [],
      },
      {
        ruleId: '@typescript-eslint/no-unsafe-call',
        meta: {
          docs: {
            description: 'Disallow calling a value with type `any`',
            url: 'https://typescript-eslint.io/rules/no-unsafe-call/',
          },
        },
        options: [],
      },
    ] satisfies RuleData[]);
  });

  it('should load custom rule options', async () => {
    const config: Linter.Config[] = [
      {
        rules: {
          complexity: ['warn', 30],
          eqeqeq: ['error', 'always', { null: 'never' }],
        },
      },
    ];
    await writeFile(
      path.join(workDir, 'eslint.config.cjs'),
      `module.exports = ${JSON.stringify(config, null, 2)}`,
    );

    await expect(loadRulesForFlatConfig({})).resolves.toEqual([
      {
        ruleId: 'complexity',
        meta: expect.any(Object),
        options: [30],
      },
      {
        ruleId: 'eqeqeq',
        meta: expect.any(Object),
        options: ['always', { null: 'never' }],
      },
    ] satisfies RuleData[]);
  });

  it('should create multiple rule instances when different options used', async () => {
    const config: Linter.Config[] = [
      {
        rules: {
          'max-lines': ['warn', { max: 300 }],
        },
      },
      {
        files: ['**/*.test.js'],
        rules: {
          'max-lines': ['warn', { max: 500 }],
        },
      },
    ];
    await writeFile(
      path.join(workDir, 'eslint.config.mjs'),
      `export default ${JSON.stringify(config, null, 2)}`,
    );

    await expect(loadRulesForFlatConfig({})).resolves.toEqual([
      {
        ruleId: 'max-lines',
        meta: expect.any(Object),
        options: [{ max: 300 }],
      },
      {
        ruleId: 'max-lines',
        meta: expect.any(Object),
        options: [{ max: 500 }],
      },
    ] satisfies RuleData[]);
  });
});
