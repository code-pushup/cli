import { generateConfigSource } from './codegen.js';
import type { PluginCodegenResult } from './types.js';

describe('generateConfigSource', () => {
  it('should generate config with empty plugins array', () => {
    expect(generateConfigSource([])).toBe(
      [
        "import type { CoreConfig } from '@code-pushup/models';",
        'export default { plugins: [] } satisfies CoreConfig;',
        '',
      ].join('\n'),
    );
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

    expect(generateConfigSource([plugin])).toBe(
      [
        "import type { CoreConfig } from '@code-pushup/models';",
        "import eslintPlugin from '@code-pushup/eslint-plugin';",
        'export default { plugins: [await eslintPlugin()] } satisfies CoreConfig;',
        '',
      ].join('\n'),
    );
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

    expect(generateConfigSource(plugins)).toBe(
      [
        "import type { CoreConfig } from '@code-pushup/models';",
        "import eslintPlugin from '@code-pushup/eslint-plugin';",
        "import coveragePlugin from '@code-pushup/coverage-plugin';",
        "export default { plugins: [await eslintPlugin(), await coveragePlugin({ reports: [{ resultsPath: 'coverage/lcov.info', pathToProject: '' }] })] } satisfies CoreConfig;",
        '',
      ].join('\n'),
    );
  });
});
