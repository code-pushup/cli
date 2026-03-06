import {
  computeRelativePresetImport,
  generateConfigSource,
  generatePresetSource,
  generateProjectSource,
} from './codegen.js';
import type { PluginCodegenResult } from './types.js';

const ESLINT_PLUGIN: PluginCodegenResult = {
  imports: [
    {
      moduleSpecifier: '@code-pushup/eslint-plugin',
      defaultImport: 'eslintPlugin',
    },
  ],
  pluginInit: "await eslintPlugin({ patterns: '.' })",
};

describe('generateConfigSource', () => {
  describe('TypeScript format', () => {
    it('should generate config with TODO placeholder when no plugins provided', () => {
      expect(generateConfigSource([], 'ts')).toMatchInlineSnapshot(`
        "import type { CoreConfig } from '@code-pushup/models';

        export default {
          plugins: [
            // TODO: register some plugins
          ],
        } satisfies CoreConfig;
        "
      `);
    });

    it('should generate config with a single plugin', () => {
      const plugin: PluginCodegenResult = {
        imports: [
          {
            moduleSpecifier: '@code-pushup/eslint-plugin',
            defaultImport: 'eslintPlugin',
          },
        ],
        pluginInit: 'await eslintPlugin()',
      };

      expect(generateConfigSource([plugin], 'ts')).toMatchInlineSnapshot(`
        "import eslintPlugin from '@code-pushup/eslint-plugin';
        import type { CoreConfig } from '@code-pushup/models';

        export default {
          plugins: [
            await eslintPlugin(),
          ],
        } satisfies CoreConfig;
        "
      `);
    });

    it('should generate config with combined default and named imports', () => {
      const plugin: PluginCodegenResult = {
        imports: [
          {
            moduleSpecifier: '@code-pushup/eslint-plugin',
            defaultImport: 'eslintPlugin',
            namedImports: ['eslintConfigFromAllNxProjects'],
          },
        ],
        pluginInit:
          'await eslintPlugin({ eslintrc: eslintConfigFromAllNxProjects() })',
      };

      expect(generateConfigSource([plugin], 'ts')).toMatchInlineSnapshot(`
        "import eslintPlugin, { eslintConfigFromAllNxProjects } from '@code-pushup/eslint-plugin';
        import type { CoreConfig } from '@code-pushup/models';

        export default {
          plugins: [
            await eslintPlugin({ eslintrc: eslintConfigFromAllNxProjects() }),
          ],
        } satisfies CoreConfig;
        "
      `);
    });

    it('should generate config with multiple plugins', () => {
      const plugins: PluginCodegenResult[] = [
        {
          imports: [
            {
              moduleSpecifier: '@code-pushup/eslint-plugin',
              defaultImport: 'eslintPlugin',
            },
          ],
          pluginInit: 'await eslintPlugin()',
        },
        {
          imports: [
            {
              moduleSpecifier: '@code-pushup/coverage-plugin',
              defaultImport: 'coveragePlugin',
            },
          ],
          pluginInit:
            "await coveragePlugin({ reports: [{ resultsPath: 'coverage/lcov.info', pathToProject: '' }] })",
        },
      ];

      expect(generateConfigSource(plugins, 'ts')).toMatchInlineSnapshot(`
        "import coveragePlugin from '@code-pushup/coverage-plugin';
        import eslintPlugin from '@code-pushup/eslint-plugin';
        import type { CoreConfig } from '@code-pushup/models';

        export default {
          plugins: [
            await eslintPlugin(),
            await coveragePlugin({ reports: [{ resultsPath: 'coverage/lcov.info', pathToProject: '' }] }),
          ],
        } satisfies CoreConfig;
        "
      `);
    });
  });

  describe('JavaScript format', () => {
    it('should generate JS config with TODO placeholder when no plugins provided', () => {
      expect(generateConfigSource([], 'js')).toMatchInlineSnapshot(`
        "/** @type {import('@code-pushup/models').CoreConfig} */
        export default {
          plugins: [
            // TODO: register some plugins
          ],
        };
        "
      `);
    });

    it('should generate JS config with a single plugin', () => {
      const plugin: PluginCodegenResult = {
        imports: [
          {
            moduleSpecifier: '@code-pushup/eslint-plugin',
            defaultImport: 'eslintPlugin',
          },
        ],
        pluginInit: 'await eslintPlugin()',
      };

      expect(generateConfigSource([plugin], 'js')).toMatchInlineSnapshot(`
        "import eslintPlugin from '@code-pushup/eslint-plugin';

        /** @type {import('@code-pushup/models').CoreConfig} */
        export default {
          plugins: [
            await eslintPlugin(),
          ],
        };
        "
      `);
    });

    it('should generate JS config with multiple plugins', () => {
      const plugins: PluginCodegenResult[] = [
        {
          imports: [
            {
              moduleSpecifier: '@code-pushup/eslint-plugin',
              defaultImport: 'eslintPlugin',
            },
          ],
          pluginInit: 'await eslintPlugin()',
        },
        {
          imports: [
            {
              moduleSpecifier: '@code-pushup/coverage-plugin',
              defaultImport: 'coveragePlugin',
            },
          ],
          pluginInit:
            "await coveragePlugin({ reports: [{ resultsPath: 'coverage/lcov.info', pathToProject: '' }] })",
        },
      ];

      expect(generateConfigSource(plugins, 'js')).toMatchInlineSnapshot(`
        "import coveragePlugin from '@code-pushup/coverage-plugin';
        import eslintPlugin from '@code-pushup/eslint-plugin';

        /** @type {import('@code-pushup/models').CoreConfig} */
        export default {
          plugins: [
            await eslintPlugin(),
            await coveragePlugin({ reports: [{ resultsPath: 'coverage/lcov.info', pathToProject: '' }] }),
          ],
        };
        "
      `);
    });

    it('should treat mjs format identically to js format', () => {
      expect(generateConfigSource([], 'mjs')).toBe(
        generateConfigSource([], 'js'),
      );
    });
  });
});

describe('generatePresetSource', () => {
  it('should generate TS preset with function signature and plugins', () => {
    expect(generatePresetSource([ESLINT_PLUGIN], 'ts')).toMatchInlineSnapshot(`
      "import eslintPlugin from '@code-pushup/eslint-plugin';
      import type { CoreConfig } from '@code-pushup/models';

      /**
       * Creates a Code PushUp config for a project.
       * @param project Project name
       */
      export async function createConfig(project: string): Promise<CoreConfig> {
        return {
          plugins: [
            await eslintPlugin({ patterns: '.' }),
          ],
        };
      }
      "
    `);
  });

  it('should generate JS preset with JSDoc annotation', () => {
    expect(generatePresetSource([ESLINT_PLUGIN], 'js')).toMatchInlineSnapshot(`
      "import eslintPlugin from '@code-pushup/eslint-plugin';

      /**
       * Creates a Code PushUp config for a project.
       * @param {string} project Project name
       * @returns {Promise<import('@code-pushup/models').CoreConfig>}
       */
      export async function createConfig(project) {
        return {
          plugins: [
            await eslintPlugin({ patterns: '.' }),
          ],
        };
      }
      "
    `);
  });
});

describe('generateProjectSource', () => {
  it('should generate import and createConfig call', () => {
    const source = generateProjectSource(
      'my-app',
      '../../code-pushup.preset.js',
    );
    expect(source).toMatchInlineSnapshot(`
      "import { createConfig } from '../../code-pushup.preset.js';

      export default await createConfig('my-app');
      "
    `);
  });
});

describe('computeRelativePresetImport', () => {
  it.each([
    ['packages/my-app', 'code-pushup.preset.ts', '../../code-pushup.preset.js'],
    ['apps/web', 'code-pushup.preset.mjs', '../../code-pushup.preset.mjs'],
    ['packages/lib', 'code-pushup.preset.js', '../../code-pushup.preset.js'],
  ])(
    'should resolve %j relative to %j as %j',
    (projectDir, presetFilename, expected) => {
      expect(computeRelativePresetImport(projectDir, presetFilename)).toBe(
        expected,
      );
    },
  );
});
