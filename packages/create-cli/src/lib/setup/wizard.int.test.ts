import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { cleanTestFolder } from '@code-pushup/test-utils';
import { getGitRoot } from '@code-pushup/utils';
import type { PluginSetupBinding } from './types.js';
import { runSetupWizard } from './wizard.js';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');
  return {
    ...actual,
    getGitRoot: vi.fn(),
  };
});

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
    vi.mocked(getGitRoot).mockResolvedValue(path.resolve(outputDir));
  });

  it('should write a valid ts config file with provided bindings', async () => {
    await runSetupWizard(TEST_BINDINGS, {
      yes: true,
      'config-format': 'ts',
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
      'config-format': 'ts',
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
      'config-format': 'ts',
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

  it('should write a js config file with .js extension for ESM package', async () => {
    await writeFile(
      path.join(outputDir, 'package.json'),
      JSON.stringify({ type: 'module' }),
    );

    await runSetupWizard(TEST_BINDINGS, {
      yes: true,
      'config-format': 'js',
      'target-dir': outputDir,
    });

    await expect(
      readFile(path.join(outputDir, 'code-pushup.config.js'), 'utf8'),
    ).resolves.toMatchInlineSnapshot(`
      "import alphaPlugin from '@code-pushup/alpha-plugin';
      import betaPlugin from '@code-pushup/beta-plugin';

      /** @type {import('@code-pushup/models').CoreConfig} */
      export default {
        plugins: [
          alphaPlugin("alpha.config.js"),
          betaPlugin(),
        ],
      };
      "
    `);
  });

  it('should write a js config file with .mjs extension for non-ESM package', async () => {
    await runSetupWizard(TEST_BINDINGS, {
      yes: true,
      'config-format': 'js',
      'target-dir': outputDir,
    });

    await expect(
      readFile(path.join(outputDir, 'code-pushup.config.mjs'), 'utf8'),
    ).resolves.toMatchInlineSnapshot(`
      "import alphaPlugin from '@code-pushup/alpha-plugin';
      import betaPlugin from '@code-pushup/beta-plugin';

      /** @type {import('@code-pushup/models').CoreConfig} */
      export default {
        plugins: [
          alphaPlugin("alpha.config.js"),
          betaPlugin(),
        ],
      };
      "
    `);
  });

  it('should create .gitignore with .code-pushup entry', async () => {
    await runSetupWizard(TEST_BINDINGS, {
      yes: true,
      'config-format': 'ts',
      'target-dir': outputDir,
    });

    await expect(
      readFile(path.join(outputDir, '.gitignore'), 'utf8'),
    ).resolves.toBe('# Code PushUp reports\n.code-pushup\n');
  });

  it('should append .code-pushup to existing .gitignore', async () => {
    await writeFile(path.join(outputDir, '.gitignore'), 'node_modules\n');

    await runSetupWizard(TEST_BINDINGS, {
      yes: true,
      'config-format': 'ts',
      'target-dir': outputDir,
    });

    await expect(
      readFile(path.join(outputDir, '.gitignore'), 'utf8'),
    ).resolves.toBe('node_modules\n\n# Code PushUp reports\n.code-pushup\n');
  });

  it('should not modify .gitignore if .code-pushup already present', async () => {
    await writeFile(
      path.join(outputDir, '.gitignore'),
      'node_modules\n.code-pushup\n',
    );

    await runSetupWizard(TEST_BINDINGS, {
      yes: true,
      'config-format': 'ts',
      'target-dir': outputDir,
    });

    await expect(
      readFile(path.join(outputDir, '.gitignore'), 'utf8'),
    ).resolves.toBe('node_modules\n.code-pushup\n');
  });
});
