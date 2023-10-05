import { ESLint } from 'eslint';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { RuleData, listRules } from './rules';

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
      await expect(listRules(eslint, patterns)).resolves.toHaveLength(48);
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

  describe('Nx monorepo', () => {
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
      await expect(listRules(eslint, patterns)).resolves.toHaveLength(95);
    });

    it('should include explicitly set plugin rule with custom options', async () => {
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
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
        meta: {
          docs: {
            description: 'Disallow unnecessary semicolons',
            recommended: true,
            url: 'https://eslint.org/docs/latest/rules/no-extra-semi',
          },
          fixable: 'code',
          messages: {
            unexpected: 'Unnecessary semicolon.',
          },
          schema: [],
          type: 'suggestion',
        },
        options: [],
        ruleId: 'no-extra-semi',
      } satisfies RuleData);
    });

    it('should include plugin rule set implicitly by extending recommended config', async () => {
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
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
        ruleId: '@typescript-eslint/no-extra-semi',
      } satisfies RuleData);
    });

    it('should include rule added by to root config by project config', async () => {
      await expect(listRules(eslint, patterns)).resolves.toContainEqual({
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
        ruleId: '@nx/dependency-checks',
      } satisfies RuleData);
    });
  });
});
