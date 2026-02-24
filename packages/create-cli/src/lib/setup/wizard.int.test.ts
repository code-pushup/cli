import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { cleanTestFolder } from '@code-pushup/test-utils';
import type { PluginSetupBinding } from './types.js';
import { runSetupWizard } from './wizard.js';

const TEST_BINDINGS: PluginSetupBinding[] = [
  {
    slug: 'alpha',
    title: 'Alpha Plugin',
    packageName: '@code-pushup/alpha-plugin',
    prompts: [
      {
        key: 'alpha.path',
        message: 'Path to config',
        type: 'input',
        default: 'alpha.config.js',
      },
    ],
    generateConfig(answers) {
      const configPath = answers['alpha.path'] ?? 'alpha.config.js';
      return {
        imports: [
          {
            moduleSpecifier: '@code-pushup/alpha-plugin',
            defaultImport: 'alphaPlugin',
          },
        ],
        pluginInit: `alphaPlugin(${JSON.stringify(configPath)})`,
      };
    },
  },
  {
    slug: 'beta',
    title: 'Beta Plugin',
    packageName: '@code-pushup/beta-plugin',
    generateConfig: () => ({
      imports: [
        {
          moduleSpecifier: '@code-pushup/beta-plugin',
          defaultImport: 'betaPlugin',
        },
      ],
      pluginInit: 'betaPlugin()',
    }),
  },
];

describe('runSetupWizard', () => {
  const outputDir = path.join('tmp', 'int', 'create-cli', 'wizard');

  beforeEach(async () => {
    await cleanTestFolder(outputDir);
  });

  it('should write a valid config file with provided bindings', async () => {
    await runSetupWizard(TEST_BINDINGS, {
      yes: true,
      'target-dir': outputDir,
    });

    await expect(
      readFile(path.join(outputDir, 'code-pushup.config.ts'), 'utf8'),
    ).resolves.toMatchInlineSnapshot(`
      "import alphaPlugin from '@code-pushup/alpha-plugin';
      import betaPlugin from '@code-pushup/beta-plugin';
      import type { CoreConfig } from '@code-pushup/models';

      export default {
        plugins: [
          alphaPlugin("alpha.config.js"),
          betaPlugin(),
        ],
      } satisfies CoreConfig;
      "
    `);
  });

  it('should not write files in dry-run mode', async () => {
    await runSetupWizard(TEST_BINDINGS, {
      yes: true,
      'dry-run': true,
      'target-dir': outputDir,
    });

    await expect(
      readFile(path.join(outputDir, 'code-pushup.config.ts'), 'utf8'),
    ).rejects.toThrow('ENOENT');
  });

  it('should pass custom plugin options through to codegen', async () => {
    await runSetupWizard(TEST_BINDINGS, {
      'alpha.path': 'custom.config.mjs',
      yes: true,
      'target-dir': outputDir,
    });

    await expect(
      readFile(path.join(outputDir, 'code-pushup.config.ts'), 'utf8'),
    ).resolves.toMatchInlineSnapshot(`
      "import alphaPlugin from '@code-pushup/alpha-plugin';
      import betaPlugin from '@code-pushup/beta-plugin';
      import type { CoreConfig } from '@code-pushup/models';

      export default {
        plugins: [
          alphaPlugin("custom.config.mjs"),
          betaPlugin(),
        ],
      } satisfies CoreConfig;
      "
    `);
  });
});
