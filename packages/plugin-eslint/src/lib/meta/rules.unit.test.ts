import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { MockInstance } from 'vitest';
import type { ESLintTarget } from '../config.js';
import type { RuleData } from './parse.js';
import { listRules } from './rules.js';

describe('listRules', () => {
  const fixturesDir = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '..',
    '..',
    '..',
    'mocks',
    'fixtures',
  );

  let cwdSpy: MockInstance<[], string>;

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd');
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  describe('React app', () => {
    const appRootDir = path.join(fixturesDir, 'todos-app');
    const eslintrc = path.join(appRootDir, '.eslintrc.js');

    const patterns = ['src/**/*.js', 'src/**/*.jsx'];
    const targets: ESLintTarget[] = [{ eslintrc, patterns }];

    beforeAll(() => {
      cwdSpy.mockReturnValue(appRootDir);
    });

    it('should list expected number of rules', async () => {
      await expect(listRules(targets)).resolves.toHaveLength(31);
    });

    it('should include explicitly set built-in rule', async () => {
      await expect(listRules(targets)).resolves.toContainEqual({
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
      await expect(listRules(targets)).resolves.toContainEqual({
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
    const nxRootDir = path.join(fixturesDir, 'nx-monorepo');
    const eslintrc = path.join(nxRootDir, 'packages/utils/.eslintrc.json');

    const patterns = ['packages/utils/**/*.ts', 'packages/utils/**/*.json'];
    const targets: ESLintTarget[] = [{ eslintrc, patterns }];

    beforeAll(() => {
      cwdSpy.mockReturnValue(nxRootDir);
    });

    it('should list expected number of rules', async () => {
      const rules = await listRules(targets);
      expect(rules.length).toBeGreaterThanOrEqual(50);
    });

    it('should include explicitly set plugin rule with custom options', async () => {
      // set in root .eslintrc.json
      await expect(listRules(targets)).resolves.toContainEqual({
        ruleId: '@nx/enforce-module-boundaries',
        meta: expect.any(Object),
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
      await expect(listRules(targets)).resolves.toContainEqual({
        ruleId: 'no-var',
        meta: expect.any(Object),
        options: [],
      } as RuleData);
    });

    it('should include plugin rule set implicitly by extending recommended config', async () => {
      // extended via @nx/typescript -> @typescript-eslint/recommended
      await expect(listRules(targets)).resolves.toContainEqual({
        ruleId: '@typescript-eslint/no-unused-vars',
        meta: expect.any(Object),
        options: [],
      } satisfies RuleData);
    });

    it('should not include rule which was turned off in extended config', async () => {
      // extended TypeScript config sets "no-unused-semi": "off"
      await expect(listRules(targets)).resolves.not.toContainEqual(
        expect.objectContaining({
          ruleId: 'no-unused-vars',
        } satisfies Partial<RuleData>),
      );
    });

    it('should include rule added to root config by project config', async () => {
      // set only in packages/utils/.eslintrc.json
      await expect(listRules(targets)).resolves.toContainEqual({
        ruleId: '@nx/dependency-checks',
        meta: expect.any(Object),
        options: [],
      } satisfies RuleData);
    });
  });
});
