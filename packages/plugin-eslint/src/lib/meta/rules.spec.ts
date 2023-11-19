import { ESLint } from 'eslint';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { SpyInstance } from 'vitest';
import { expect } from 'vitest';
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
    const eslintrcLib1 = (rcPath = '.eslintrc.json') =>
      join(nxRootDir, 'packages/lib1', rcPath);
    const eslintNew = (rc = eslintrcLib1()) =>
      new ESLint({
        useEslintrc: false,
        baseConfig: { extends: rc },
      });
    const patternsNew = ['packages/lib1/**/*.ts', 'packages/lib1/**/*.json'];

    beforeAll(() => {
      cwdSpy.mockReturnValue(nxRootDir);
    });

    it('should list expected number of rules excluding disabled rules', async () => {
      // +1 from root:
      //  - +1 set explicitly
      // +1 from lib1:
      // - +1 set explicitly
      // - -1 disable existing rule from root
      await expect(listRules(eslintNew(), patternsNew)).resolves.toHaveLength(
        1,
      );
    });

    it('should include eslint built-in rule set implicitly by extending recommended config', async () => {
      const rules = await listRules(
        eslintNew(eslintrcLib1('.eslintrc.extend-built-in.json')),
        patternsNew,
      );

      expect(rules).toHaveLength(61);

      expect(rules).toContainEqual({
        meta: {
          docs: {
            description: 'Require generator functions to contain `yield`',
            recommended: true,
            url: 'https://eslint.org/docs/latest/rules/require-yield',
          },
          messages: {
            missingYield: "This generator function does not have 'yield'.",
          },
          schema: [],
          type: 'suggestion',
        },
        options: [],
        ruleId: 'require-yield',
      } as RuleData);
    });

    it('should include explicitly set plugin rule with custom options', async () => {
      // set in root .eslintrc.json
      await expect(
        listRules(
          eslintNew(eslintrcLib1('.eslintrc.extend-plugin.json')),
          patternsNew,
        ),
      ).resolves.toContainEqual(
        expect.objectContaining({
          ruleId: '@typescript-eslint/array-type',
          meta: {
            docs: expect.objectContaining({
              description: expect.any(String),
              recommended: expect.any(String),
              url: expect.any(String),
            }),
            fixable: expect.any(String),
            messages: expect.any(Object),
            schema: expect.any(Array),
            type: expect.any(String),
          },
          options: [{ default: 'generic' }],
        }),
      );
    });

    it('should include @typescript-eslint rule set implicitly by extending recommended-type-checked config', async () => {
      const rules = await listRules(
        eslintNew(eslintrcLib1('.eslintrc.extend-plugin.json')),
        patternsNew,
      );

      expect(rules).toHaveLength(41);

      expect(rules).toContainEqual({
        meta: {
          docs: {
            description: 'Require rest parameters instead of `arguments`',
            recommended: false,
            url: 'https://eslint.org/docs/latest/rules/prefer-rest-params',
          },
          messages: {
            preferRestParams: "Use the rest parameters instead of 'arguments'.",
          },
          schema: [],
          type: 'suggestion',
        },
        options: [],
        ruleId: 'prefer-rest-params',
      } satisfies RuleData);
    });

    it('should not include rule which was turned off in extended config', async () => {
      // extended TypeScript config sets "no-extra-semi": "off"
      await expect(
        listRules(
          eslintNew(eslintrcLib1('.eslintrc.extend-plugin.json')),
          patternsNew,
        ),
      ).resolves.not.toContainEqual(
        expect.objectContaining({
          ruleId: 'no-extra-semi',
        } satisfies Partial<RuleData>),
      );
    });

    it('should include rule added to root config by project config', async () => {
      // set only in packages/lib1/.eslintrc.json
      //  "no-async-promise-executor": 1
      await expect(
        listRules(eslintNew(eslintrcLib1()), patternsNew),
      ).resolves.toContainEqual({
        meta: {
          docs: {
            description:
              'Disallow using an async function as a Promise executor',
            recommended: true,
            url: 'https://eslint.org/docs/latest/rules/no-async-promise-executor',
          },
          fixable: null as unknown as undefined, // Type inconsistency in eslint null is not included
          messages: {
            async: 'Promise executor functions should not be async.',
          },
          schema: [],
          type: 'problem',
        },
        options: [],
        ruleId: 'no-async-promise-executor',
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
