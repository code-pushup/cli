import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import {
  findCodePushupEslintConfig,
  findEslintConfig,
  getLintFilePatterns,
} from './utils';

describe('findCodePushupEslintConfig', () => {
  describe('flat config format', () => {
    const fileContent = `import javascript from '@code-pushup/eslint-config/javascript';\n\nexport default javascript;\n`;

    it('should find code-pushup.eslint.config.js', async () => {
      vol.fromJSON(
        {
          'packages/cli/code-pushup.eslint.config.js': fileContent,
          'packages/core/code-pushup.eslint.config.js': fileContent,
        },
        MEMFS_VOLUME,
      );

      await expect(
        findCodePushupEslintConfig({ root: 'packages/cli' }, 'flat'),
      ).resolves.toBe('./packages/cli/code-pushup.eslint.config.js');
    });

    it('should find eslint.config.code-pushup.mjs', async () => {
      vol.fromJSON(
        {
          'packages/cli/eslint.config.code-pushup.mjs': fileContent,
          'packages/core/eslint.config.code-pushup.mjs': fileContent,
        },
        MEMFS_VOLUME,
      );

      await expect(
        findCodePushupEslintConfig({ root: 'packages/core' }, 'flat'),
      ).resolves.toBe('./packages/core/eslint.config.code-pushup.mjs');
    });

    it('should find eslint.strict.config.js', async () => {
      vol.fromJSON(
        {
          'packages/cli/eslint.strict.config.mjs': fileContent,
          'packages/core/eslint.strict.config.js': fileContent,
        },
        MEMFS_VOLUME,
      );

      await expect(
        findCodePushupEslintConfig({ root: 'packages/core' }, 'flat'),
      ).resolves.toBe('./packages/core/eslint.strict.config.js');
    });

    it('should return undefined if no config exists', async () => {
      vol.fromJSON({}, MEMFS_VOLUME);

      await expect(
        findCodePushupEslintConfig({ root: 'libs/utils' }, 'flat'),
      ).resolves.toBeUndefined();
    });

    it('should return undefined if only standard config exists', async () => {
      vol.fromJSON(
        { 'libs/utils/eslint.config.js': fileContent },
        MEMFS_VOLUME,
      );

      await expect(
        findCodePushupEslintConfig({ root: 'libs/utils' }, 'flat'),
      ).resolves.toBeUndefined();
    });
  });

  describe('legacy config format', () => {
    it('should find code-pushup.eslintrc.json', async () => {
      vol.fromJSON(
        {
          'packages/cli/code-pushup.eslintrc.json':
            '{ "extends": "@code-pushup" }',
          'packages/core/code-pushup.eslintrc.json':
            '{ "extends": "@code-pushup" }',
        },
        MEMFS_VOLUME,
      );

      await expect(
        findCodePushupEslintConfig({ root: 'packages/cli' }, 'legacy'),
      ).resolves.toBe('./packages/cli/code-pushup.eslintrc.json');
    });

    it('should find .eslintrc.code-pushup.json', async () => {
      vol.fromJSON(
        {
          'packages/cli/.eslintrc.code-pushup.json':
            "module.exports = { extends: '@code-pushup' };",
          'packages/core/.eslintrc.code-pushup.json':
            "module.exports = { extends: '@code-pushup' };",
        },
        MEMFS_VOLUME,
      );

      await expect(
        findCodePushupEslintConfig({ root: 'packages/core' }, 'legacy'),
      ).resolves.toBe('./packages/core/.eslintrc.code-pushup.json');
    });

    it('should return undefined if no config exists', async () => {
      vol.fromJSON({}, MEMFS_VOLUME);

      await expect(
        findCodePushupEslintConfig({ root: 'libs/utils' }, 'legacy'),
      ).resolves.toBeUndefined();
    });

    it('should return undefined if only standard config exists', async () => {
      vol.fromJSON(
        {
          'libs/utils/.eslintrc.json':
            '{ "extends": "@code-pushup/eslint-config" }',
        },
        MEMFS_VOLUME,
      );

      await expect(
        findCodePushupEslintConfig({ root: 'libs/utils' }, 'legacy'),
      ).resolves.toBeUndefined();
    });
  });
});

describe('findEslintConfig', () => {
  it('should use eslintConfig from project.json if configured', async () => {
    await expect(
      findEslintConfig(
        {
          root: 'packages/cli',
          targets: {
            lint: {
              options: { eslintConfig: 'packages/cli/eslint.ci.config.js' },
            },
          },
        },
        'flat',
      ),
    ).resolves.toBe('packages/cli/eslint.ci.config.js');
  });

  describe('flat config format', () => {
    const fileContent = `import javascript from '@code-pushup/eslint-config/javascript';\n\nexport default javascript;\n`;

    it('should find eslint.config.js', async () => {
      vol.fromJSON(
        {
          'packages/cli/eslint.config.js': fileContent,
          'packages/core/eslint.config.js': fileContent,
        },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'packages/cli' }, 'flat'),
      ).resolves.toBe('./packages/cli/eslint.config.js');
    });

    it('should find eslint.config.mjs', async () => {
      vol.fromJSON(
        {
          'packages/cli/eslint.config.mjs': fileContent,
          'packages/core/eslint.config.mjs': fileContent,
        },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'packages/core' }, 'flat'),
      ).resolves.toBe('./packages/core/eslint.config.mjs');
    });

    it('should look for JS extension before MJS', async () => {
      vol.fromJSON(
        {
          'libs/utils/eslint.config.js': fileContent,
          'libs/utils/eslint.config.mjs': fileContent,
        },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'libs/utils' }, 'flat'),
      ).resolves.toBe('./libs/utils/eslint.config.js');
    });

    it('should return undefined if no config exists', async () => {
      vol.fromJSON({}, MEMFS_VOLUME);

      await expect(
        findEslintConfig({ root: 'libs/utils' }, 'flat'),
      ).resolves.toBeUndefined();
    });

    it('should return undefined if only legacy config exists', async () => {
      vol.fromJSON(
        { 'libs/utils/.eslintrc.json': '{ "extends": "@code-pushup" }' },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'libs/utils' }, 'flat'),
      ).resolves.toBeUndefined();
    });
  });

  describe('legacy config format', () => {
    it('should find .eslintrc.json', async () => {
      vol.fromJSON(
        {
          'packages/cli/.eslintrc.json': '{ "extends": "@code-pushup" }',
          'packages/core/.eslintrc.json': '{ "extends": "@code-pushup" }',
        },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'packages/cli' }, 'legacy'),
      ).resolves.toBe('./packages/cli/.eslintrc.json');
    });

    it('should find .eslintrc.js', async () => {
      vol.fromJSON(
        {
          'packages/cli/.eslintrc.json': '{ "extends": "@code-pushup" }',
          'packages/core/.eslintrc.js':
            "module.exports = { extends: '@code-pushup' };",
        },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'packages/core' }, 'legacy'),
      ).resolves.toBe('./packages/core/.eslintrc.js');
    });

    it('should look for JSON extension before JavaScript', async () => {
      vol.fromJSON(
        {
          'libs/utils/.eslintrc.js':
            "module.exports = { extends: '@code-pushup' };",
          'libs/utils/.eslintrc.json': '{ "extends": "@code-pushup" }',
        },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'libs/utils' }, 'legacy'),
      ).resolves.toBe('./libs/utils/.eslintrc.json');
    });

    it('should look for JavaScript extensions before YAML', async () => {
      vol.fromJSON(
        {
          'libs/utils/.eslintrc.cjs':
            "module.exports = { extends: '@code-pushup' };",
          'libs/utils/.eslintrc.yml': '- extends: "@code-pushup"\n',
        },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'libs/utils' }, 'legacy'),
      ).resolves.toBe('./libs/utils/.eslintrc.cjs');
    });

    it('should return undefined if no config exists', async () => {
      vol.fromJSON({}, MEMFS_VOLUME);

      await expect(
        findEslintConfig({ root: 'libs/utils' }, 'legacy'),
      ).resolves.toBeUndefined();
    });

    it('should return undefined if only flat config exists', async () => {
      vol.fromJSON(
        { 'libs/utils/eslint.config.js': 'export default [/*...*/]' },
        MEMFS_VOLUME,
      );

      await expect(
        findEslintConfig({ root: 'libs/utils' }, 'legacy'),
      ).resolves.toBeUndefined();
    });
  });
});

describe('getLintFilePatterns', () => {
  it('should get lintFilePatterns from project.json if configured', () => {
    expect(
      getLintFilePatterns(
        {
          root: 'apps/website',
          targets: {
            lint: {
              options: {
                lintFilePatterns: [
                  'apps/website/**/*.ts',
                  'apps/website/**/*.html',
                ],
              },
            },
          },
        },
        'flat',
      ),
    ).toEqual(['apps/website/**/*.ts', 'apps/website/**/*.html']);
  });

  it('should default to project root folder if using flat config', () => {
    expect(getLintFilePatterns({ root: 'apps/website' }, 'flat')).toEqual([
      'apps/website',
    ]);
  });

  it('should default to all files in project root folder if using legacy config', () => {
    expect(getLintFilePatterns({ root: 'apps/website' }, 'legacy')).toEqual(
      expect.arrayContaining(['apps/website/**/*']),
    );
  });

  it('should add additional patterns to defaults if using legacy config', () => {
    expect(getLintFilePatterns({ root: 'apps/website' }, 'legacy')).toEqual([
      'apps/website/**/*',
      'apps/website/*.spec.ts',
      'apps/website/*.cy.ts',
      'apps/website/*.stories.ts',
      'apps/website/.storybook/main.ts',
    ]);
  });

  it('should add additional patterns to lintFilePatterns if using legacy config', () => {
    expect(
      getLintFilePatterns(
        {
          root: 'apps/website',
          targets: {
            lint: {
              options: {
                lintFilePatterns: [
                  'apps/website/**/*.ts',
                  'apps/website/**/*.html',
                ],
              },
            },
          },
        },
        'legacy',
      ),
    ).toEqual([
      'apps/website/**/*.ts',
      'apps/website/**/*.html',
      'apps/website/*.spec.ts',
      'apps/website/*.cy.ts',
      'apps/website/*.stories.ts',
      'apps/website/.storybook/main.ts',
    ]);
  });
});
