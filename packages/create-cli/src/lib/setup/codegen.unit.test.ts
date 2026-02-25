import { generateConfigSource } from './codegen.js';
import type { PluginCodegenResult } from './types.js';

describe('generateConfigSource', () => {
  describe('TypeScript format', () => {
    it('should generate config with empty plugins array', () => {
      expect(generateConfigSource([], 'ts')).toMatchInlineSnapshot(`
        "import type { CoreConfig } from '@code-pushup/models';

        export default {
          plugins: [],
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
    it('should generate JS config with empty plugins array', () => {
      expect(generateConfigSource([], 'js')).toMatchInlineSnapshot(`
        "/** @type {import('@code-pushup/models').CoreConfig} */
        export default {
          plugins: [],
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
