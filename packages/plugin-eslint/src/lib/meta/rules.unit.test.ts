import { ESLint } from 'eslint';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { RuleData, listRules, parseRuleId } from './rules';

describe('listRules', () => {
  const fixturesDir = join(
    fileURLToPath(dirname(import.meta.url)),
    '..',
    '..',
    '..',
    'test',
    'fixtures',
  );

  let cwdSpy: SpyInstance;

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd');
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  describe('React app', () => {
    const appRootDir = join(fixturesDir, 'todos-app');
    const eslintrc = join(appRootDir, '.eslintrc.js');

    const eslint = new ESLint({
      useEslintrc: false,
      baseConfig: { extends: eslintrc },
    });
    const patterns = ['src/**/*.js', 'src/**/*.jsx'];

    beforeAll(() => {
      cwdSpy.mockReturnValue(appRootDir);
    });

    it('should list expected number of rules', async () => {
      await expect(listRules(eslint, patterns)).resolves.toHaveLength(47);
    });

    it('should include explicitly set built-in rule', async () => {
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
        ruleId: 'no-const-assign',
        meta: {
          docs: {
            description: 'Disallow reassigning `const` variables',
            recommended: true,
            url: 'https://eslint.org/docs/latest/rules/no-const-assign',
          },
          messages: {
            const: "'{{name}}' is constant.",
          },
          schema: [],
          type: 'problem',
        },
        options: [],
      } satisfies RuleData);
    });

    it('should include explicitly set plugin rule', async () => {
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
        ruleId: 'react/jsx-key',
        meta: {
          docs: {
            category: 'Possible Errors',
            description:
              'Disallow missing `key` props in iterators/collection literals',
            recommended: true,
            url: 'https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules/jsx-key.md',
          },
          messages: expect.any(Object),
          schema: [
            {
              additionalProperties: false,
              properties: {
                checkFragmentShorthand: { default: false, type: 'boolean' },
                checkKeyMustBeforeSpread: { default: false, type: 'boolean' },
                warnOnDuplicates: { default: false, type: 'boolean' },
              },
              type: 'object',
            },
          ],
        },
        options: [],
      } satisfies RuleData);
    });
  });

  describe('Nx monorepo project', () => {
    const nxRootDir = join(fixturesDir, 'nx-monorepo');
    const eslintrc = join(nxRootDir, 'packages/utils/.eslintrc.json');

    const eslint = new ESLint({
      useEslintrc: false,
      baseConfig: { extends: eslintrc },
    });
    const patterns = ['packages/utils/**/*.ts', 'packages/utils/**/*.json'];

    beforeAll(() => {
      cwdSpy.mockReturnValue(nxRootDir);
    });

    it('should list expected number of rules', async () => {
      await expect(listRules(eslint, patterns)).resolves.toHaveLength(69);
    });

    it('should include explicitly set plugin rule with custom options', async () => {
      // set in root .eslintrc.json
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
        ruleId: '@nx/enforce-module-boundaries',
        meta: {
          docs: {
            description:
              'Ensure that module boundaries are respected within the monorepo',
            // @ts-expect-error Nx rule produces string, but ESLint types expect boolean
            recommended: 'error',
            url: '',
          },
          fixable: 'code',
          messages: expect.any(Object),
          schema: [
            {
              additionalProperties: false,
              properties: expect.any(Object),
              type: 'object',
            },
          ],
          type: 'suggestion',
        },
        options: [
          {
            allow: [],
            depConstraints: [
              {
                onlyDependOnLibsWithTags: ['*'],
                sourceTag: '*',
              },
            ],
            enforceBuildableLibDependency: true,
          },
        ],
      } satisfies RuleData);
    });

    it('should include built-in rule set implicitly by extending recommended config', async () => {
      // extended via @nx/typescript -> @typescript-eslint/eslint-recommended
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
        ruleId: 'no-var',
        meta: {
          docs: {
            description: 'Require `let` or `const` instead of `var`',
            recommended: false,
            url: 'https://eslint.org/docs/latest/rules/no-var',
          },
          fixable: 'code',
          messages: {
            unexpectedVar: 'Unexpected var, use let or const instead.',
          },
          schema: [],
          type: 'suggestion',
        },
        options: [],
      } as RuleData);
    });

    it('should include plugin rule set implicitly by extending recommended config', async () => {
      // extended via @nx/typescript -> @typescript-eslint/recommended
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
        ruleId: '@typescript-eslint/no-extra-semi',
        meta: {
          docs: {
            description: 'Disallow unnecessary semicolons',
            extendsBaseRule: true,
            // @ts-expect-error TypeScript rule produces string, but ESLint types expect boolean
            recommended: 'error',
            url: 'https://typescript-eslint.io/rules/no-extra-semi',
          },
          fixable: 'code',
          hasSuggestions: undefined,
          messages: {
            unexpected: 'Unnecessary semicolon.',
          },
          schema: [],
          type: 'suggestion',
        },
        options: [],
      } satisfies RuleData);
    });

    it('should not include rule which was turned off in extended config', async () => {
      // extended TypeScript config sets "no-extra-semi": "off"
      await expect(listRules(eslint, patterns)).resolves.not.toContainEqual(
        expect.objectContaining({
          ruleId: 'no-extra-semi',
        } satisfies Partial<RuleData>),
      );
    });

    it('should include rule added to root config by project config', async () => {
      // set only in packages/utils/.eslintrc.json
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
        ruleId: '@nx/dependency-checks',
        meta: {
          docs: {
            description:
              "Checks dependencies in project's package.json for version mismatches",
            // @ts-expect-error Nx rule produces string, but ESLint types expect boolean
            recommended: 'error',
            url: '',
          },
          fixable: 'code',
          messages: {
            missingDependency:
              'The "{{projectName}}" project uses the following packages, but they are missing from "{{section}}":{{packageNames}}',
            missingDependencySection:
              'Dependency sections are missing from the "package.json" but following dependencies were detected:{{dependencies}}',
            obsoleteDependency:
              'The "{{packageName}}" package is not used by "{{projectName}}" project.',
            versionMismatch:
              'The version specifier does not contain the installed version of "{{packageName}}" package: {{version}}.',
          },
          schema: [
            {
              additionalProperties: false,
              properties: {
                buildTargets: [{ type: 'string' }],
                checkMissingDependencies: { type: 'boolean' },
                checkObsoleteDependencies: { type: 'boolean' },
                checkVersionMismatches: { type: 'boolean' },
                ignoredDependencies: [{ type: 'string' }],
                includeTransitiveDependencies: { type: 'boolean' },
              },
              type: 'object',
            },
          ],
          type: 'suggestion',
        },
        options: [],
      } satisfies RuleData);
    });
  });
});

describe('parseRuleId', () => {
  it.each([
    {
      ruleId: 'prefer-const',
      name: 'prefer-const',
    },
    {
      ruleId: 'sonarjs/no-identical-functions',
      plugin: 'sonarjs',
      name: 'no-identical-functions',
    },
    {
      ruleId: '@typescript-eslint/no-non-null-assertion',
      plugin: '@typescript-eslint',
      name: 'no-non-null-assertion',
    },
    {
      ruleId: 'no-secrets/no-secrets',
      plugin: 'no-secrets',
      name: 'no-secrets',
    },
    {
      ruleId: '@angular-eslint/template/no-negated-async',
      plugin: '@angular-eslint/template',
      name: 'no-negated-async',
    },
  ])('$ruleId => name: $name, plugin: $plugin', ({ ruleId, name, plugin }) => {
    expect(parseRuleId(ruleId)).toEqual({ name, plugin });
  });
});
