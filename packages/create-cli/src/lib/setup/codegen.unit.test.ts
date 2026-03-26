import type { CategoryConfig } from '@code-pushup/models';
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
  pluginInit: ["await eslintPlugin({ patterns: '.' }),"],
};

const ESLINT_CATEGORIES: CategoryConfig[] = [
  {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
  },
  {
    slug: 'code-style',
    title: 'Code style',
    refs: [{ type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 }],
  },
];

const ESLINT_PLUGIN_WITH_CATEGORIES: PluginCodegenResult = {
  ...ESLINT_PLUGIN,
  categories: ESLINT_CATEGORIES,
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
        pluginInit: ['await eslintPlugin(),'],
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
        pluginInit: [
          'await eslintPlugin({ eslintrc: eslintConfigFromAllNxProjects() }),',
        ],
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

    it('should generate config with multiple plugins including multiline', () => {
      const plugins: PluginCodegenResult[] = [
        {
          imports: [
            {
              moduleSpecifier: '@code-pushup/eslint-plugin',
              defaultImport: 'eslintPlugin',
            },
          ],
          pluginInit: ['await eslintPlugin(),'],
        },
        {
          imports: [
            {
              moduleSpecifier: '@code-pushup/coverage-plugin',
              defaultImport: 'coveragePlugin',
            },
          ],
          pluginInit: [
            'await coveragePlugin({',
            "  reports: ['coverage/lcov.info'],",
            '}),',
          ],
        },
      ];

      expect(generateConfigSource(plugins, 'ts')).toMatchInlineSnapshot(`
        "import coveragePlugin from '@code-pushup/coverage-plugin';
        import eslintPlugin from '@code-pushup/eslint-plugin';
        import type { CoreConfig } from '@code-pushup/models';

        export default {
          plugins: [
            await eslintPlugin(),
            await coveragePlugin({
              reports: ['coverage/lcov.info'],
            }),
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
        pluginInit: ['await eslintPlugin(),'],
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
          pluginInit: ['await eslintPlugin(),'],
        },
        {
          imports: [
            {
              moduleSpecifier: '@code-pushup/coverage-plugin',
              defaultImport: 'coveragePlugin',
            },
          ],
          pluginInit: [
            "await coveragePlugin({ reports: [{ resultsPath: 'coverage/lcov.info', pathToProject: '' }] }),",
          ],
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

  describe('categories', () => {
    it('should include categories block when plugin provides categories', () => {
      expect(generateConfigSource([ESLINT_PLUGIN_WITH_CATEGORIES], 'ts'))
        .toMatchInlineSnapshot(`
          "import eslintPlugin from '@code-pushup/eslint-plugin';
          import type { CoreConfig } from '@code-pushup/models';

          export default {
            plugins: [
              await eslintPlugin({ patterns: '.' }),
            ],
            categories: [
              {
                slug: 'bug-prevention',
                title: 'Bug prevention',
                refs: [
                  { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
                ],
              },
              {
                slug: 'code-style',
                title: 'Code style',
                refs: [
                  { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
                ],
              },
            ],
          } satisfies CoreConfig;
          "
        `);
    });

    it('should omit categories block when no categories provided', () => {
      const source = generateConfigSource([ESLINT_PLUGIN], 'ts');
      expect(source).not.toContain('categories');
    });

    it('should merge categories from multiple plugins', () => {
      const coveragePlugin: PluginCodegenResult = {
        imports: [
          {
            moduleSpecifier: '@code-pushup/coverage-plugin',
            defaultImport: 'coveragePlugin',
          },
        ],
        pluginInit: ['await coveragePlugin(),'],
        categories: [
          {
            slug: 'code-coverage',
            title: 'Code coverage',
            refs: [
              {
                type: 'group',
                plugin: 'coverage',
                slug: 'coverage',
                weight: 1,
              },
            ],
          },
        ],
      };
      const source = generateConfigSource(
        [ESLINT_PLUGIN_WITH_CATEGORIES, coveragePlugin],
        'ts',
      );
      expect(source).toContain("slug: 'bug-prevention'");
      expect(source).toContain("slug: 'code-style'");
      expect(source).toContain("slug: 'code-coverage'");
    });

    it('should include categories in JS format config', () => {
      const source = generateConfigSource(
        [ESLINT_PLUGIN_WITH_CATEGORIES],
        'js',
      );
      expect(source).toContain('categories: [');
      expect(source).toContain("slug: 'bug-prevention'");
    });

    it.each([
      ["Project's docs", String.raw`title: 'Project\'s docs'`],
      [String.raw`C:\Users\test`, String.raw`title: 'C:\\Users\\test'`],
      ['Line one\nLine two', String.raw`title: 'Line one\nLine two'`],
    ])('should escape %j in category title', (title, expected) => {
      const plugin: PluginCodegenResult = {
        ...ESLINT_PLUGIN,
        categories: [
          {
            slug: 'test',
            title,
            refs: [{ type: 'audit', plugin: 'p', slug: 's', weight: 1 }],
          },
        ],
      };
      expect(generateConfigSource([plugin], 'ts')).toContain(expected);
    });

    it('should include description and docsUrl when provided', () => {
      const plugin: PluginCodegenResult = {
        ...ESLINT_PLUGIN,
        categories: [
          {
            slug: 'perf',
            title: 'Performance',
            description: 'Measures runtime performance.',
            docsUrl: 'https://example.com/perf',
            refs: [{ type: 'audit', plugin: 'perf', slug: 'lcp', weight: 1 }],
          },
        ],
      };
      const source = generateConfigSource([plugin], 'ts');
      expect(source).toContain("description: 'Measures runtime performance.'");
      expect(source).toContain("docsUrl: 'https://example.com/perf'");
    });

    it('should merge categories with same slug from different plugins', () => {
      const ref = (plugin: string, slug: string) => ({
        type: 'group' as const,
        plugin,
        slug,
        weight: 1,
      });
      const source = generateConfigSource(
        [
          {
            ...ESLINT_PLUGIN,
            categories: [
              {
                slug: 'bugs',
                title: 'Bugs',
                refs: [ref('eslint', 'problems')],
              },
            ],
          },
          {
            ...ESLINT_PLUGIN,
            categories: [
              { slug: 'bugs', title: 'Bugs', refs: [ref('ts', 'errors')] },
            ],
          },
        ],
        'ts',
      );
      expect(source.match(/slug: 'bugs'/g)).toHaveLength(1);
      expect(source).toContain("plugin: 'eslint'");
      expect(source).toContain("plugin: 'ts'");
    });
  });

  describe('pluginDeclaration', () => {
    it('should emit variable declaration between imports and config export', () => {
      const plugin: PluginCodegenResult = {
        imports: [
          {
            moduleSpecifier: '@code-pushup/lighthouse-plugin',
            defaultImport: 'lighthousePlugin',
          },
        ],
        pluginDeclaration: {
          identifier: 'lhPlugin',
          expression: "lighthousePlugin('http://localhost:4200')",
        },
        pluginInit: ['lhPlugin,'],
      };
      expect(generateConfigSource([plugin], 'ts')).toMatchInlineSnapshot(`
        "import lighthousePlugin from '@code-pushup/lighthouse-plugin';
        import type { CoreConfig } from '@code-pushup/models';

        const lhPlugin = lighthousePlugin('http://localhost:4200');

        export default {
          plugins: [
            lhPlugin,
          ],
        } satisfies CoreConfig;
        "
      `);
    });
  });

  describe('expression refs', () => {
    it('should generate config with expression refs and merged categories', () => {
      expect(
        generateConfigSource(
          [
            {
              imports: [
                {
                  moduleSpecifier: '@code-pushup/lighthouse-plugin',
                  defaultImport: 'lighthousePlugin',
                  namedImports: ['lighthouseGroupRefs'],
                },
              ],
              pluginDeclaration: {
                identifier: 'lhPlugin',
                expression: "lighthousePlugin('http://localhost:4200')",
              },
              pluginInit: ['lhPlugin,'],
              categories: [
                {
                  slug: 'a11y',
                  title: 'Accessibility',
                  refsExpression:
                    "lighthouseGroupRefs(lhPlugin, 'accessibility')",
                },
                {
                  slug: 'performance',
                  title: 'Performance',
                  refsExpression:
                    "lighthouseGroupRefs(lhPlugin, 'performance')",
                },
              ],
            },
            {
              imports: [
                {
                  moduleSpecifier: '@code-pushup/axe-plugin',
                  defaultImport: 'axePlugin',
                  namedImports: ['axeGroupRefs'],
                },
              ],
              pluginDeclaration: {
                identifier: 'axe',
                expression: "axePlugin('http://localhost:4200')",
              },
              pluginInit: ['axe,'],
              categories: [
                {
                  slug: 'a11y',
                  title: 'Accessibility',
                  refsExpression: 'axeGroupRefs(axe)',
                },
              ],
            },
          ],
          'ts',
        ),
      ).toMatchInlineSnapshot(`
        "import axePlugin, { axeGroupRefs } from '@code-pushup/axe-plugin';
        import lighthousePlugin, { lighthouseGroupRefs } from '@code-pushup/lighthouse-plugin';
        import type { CoreConfig } from '@code-pushup/models';

        const lhPlugin = lighthousePlugin('http://localhost:4200');
        const axe = axePlugin('http://localhost:4200');

        export default {
          plugins: [
            lhPlugin,
            axe,
          ],
          categories: [
            {
              slug: 'a11y',
              title: 'Accessibility',
              refs: [
                ...lighthouseGroupRefs(lhPlugin, 'accessibility'),
                ...axeGroupRefs(axe),
              ],
            },
            {
              slug: 'performance',
              title: 'Performance',
              refs: [
                ...lighthouseGroupRefs(lhPlugin, 'performance'),
              ],
            },
          ],
        } satisfies CoreConfig;
        "
      `);
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

  it('should include categories in TS preset source', () => {
    expect(generatePresetSource([ESLINT_PLUGIN_WITH_CATEGORIES], 'ts'))
      .toMatchInlineSnapshot(`
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
            categories: [
              {
                slug: 'bug-prevention',
                title: 'Bug prevention',
                refs: [
                  { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
                ],
              },
              {
                slug: 'code-style',
                title: 'Code style',
                refs: [
                  { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
                ],
              },
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
