import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { logger } from '@code-pushup/utils';
import { addCodePushUpCommand, listProjects } from './monorepo.js';
import type { PluginSetupBinding } from './types.js';
import { runSetupWizard } from './wizard.js';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
  input: vi.fn(),
  select: vi.fn(),
}));

vi.mock('./monorepo.js', async importOriginal => ({
  ...(await importOriginal<typeof import('./monorepo.js')>()),
  listProjects: vi.fn().mockResolvedValue([]),
  addCodePushUpCommand: vi.fn().mockResolvedValue(undefined),
}));

const TEST_BINDING: PluginSetupBinding = {
  slug: 'test-plugin',
  title: 'Test Plugin',
  packageName: '@code-pushup/test-plugin',
  isRecommended: () => Promise.resolve(true),
  generateConfig: () => ({
    imports: [
      {
        moduleSpecifier: '@code-pushup/test-plugin',
        defaultImport: 'testPlugin',
      },
    ],
    pluginInit: ['testPlugin(),'],
  }),
};

describe('runSetupWizard', () => {
  describe('TypeScript config', () => {
    beforeEach(() => {
      vol.fromJSON({ 'tsconfig.json': '{}' }, MEMFS_VOLUME);
    });

    it('should generate ts config and log success', async () => {
      await runSetupWizard([TEST_BINDING], {
        yes: true,
        'target-dir': MEMFS_VOLUME,
      });

      await expect(readFile(`${MEMFS_VOLUME}/code-pushup.config.ts`, 'utf8'))
        .resolves.toMatchInlineSnapshot(`
        "import type { CoreConfig } from '@code-pushup/models';
        import testPlugin from '@code-pushup/test-plugin';

        export default {
          plugins: [
            testPlugin(),
          ],
        } satisfies CoreConfig;
        "
      `);

      expect(logger.info).toHaveBeenCalledWith('CREATE code-pushup.config.ts');
      expect(logger.info).toHaveBeenCalledWith('Setup complete.');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('npx code-pushup'),
      );
    });

    it('should log dry-run message without writing files', async () => {
      await runSetupWizard([TEST_BINDING], {
        yes: true,
        'dry-run': true,
        'target-dir': MEMFS_VOLUME,
      });

      expect(vol.toJSON(MEMFS_VOLUME)).toStrictEqual({
        [`${MEMFS_VOLUME}/tsconfig.json`]: '{}',
      });
      expect(logger.info).toHaveBeenCalledWith('CREATE code-pushup.config.ts');
      expect(logger.info).toHaveBeenCalledWith('Dry run — no files written.');
    });

    it('should generate config with TODO placeholder when no bindings provided', async () => {
      await runSetupWizard([], {
        yes: true,
        'target-dir': MEMFS_VOLUME,
      });

      await expect(readFile(`${MEMFS_VOLUME}/code-pushup.config.ts`, 'utf8'))
        .resolves.toMatchInlineSnapshot(`
        "import type { CoreConfig } from '@code-pushup/models';

        export default {
          plugins: [
            // TODO: register some plugins
          ],
        } satisfies CoreConfig;
        "
      `);

      expect(logger.info).toHaveBeenCalledWith('CREATE code-pushup.config.ts');
      expect(logger.info).toHaveBeenCalledWith('Setup complete.');
    });
  });

  describe('JavaScript config', () => {
    beforeEach(() => {
      vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);
    });

    it('should generate .mjs config when js format is auto-detected', async () => {
      await runSetupWizard([TEST_BINDING], {
        yes: true,
        'target-dir': MEMFS_VOLUME,
      });

      await expect(readFile(`${MEMFS_VOLUME}/code-pushup.config.mjs`, 'utf8'))
        .resolves.toMatchInlineSnapshot(`
        "import testPlugin from '@code-pushup/test-plugin';

        /** @type {import('@code-pushup/models').CoreConfig} */
        export default {
          plugins: [
            testPlugin(),
          ],
        };
        "
      `);

      expect(logger.info).toHaveBeenCalledWith('CREATE code-pushup.config.mjs');
    });

    it('should generate .js config when package.json has "type": "module"', async () => {
      vol.fromJSON(
        { 'package.json': JSON.stringify({ type: 'module' }) },
        MEMFS_VOLUME,
      );

      await runSetupWizard([TEST_BINDING], {
        yes: true,
        'config-format': 'js',
        'target-dir': MEMFS_VOLUME,
      });

      await expect(readFile(`${MEMFS_VOLUME}/code-pushup.config.js`, 'utf8'))
        .resolves.toMatchInlineSnapshot(`
        "import testPlugin from '@code-pushup/test-plugin';

        /** @type {import('@code-pushup/models').CoreConfig} */
        export default {
          plugins: [
            testPlugin(),
          ],
        };
        "
      `);

      expect(logger.info).toHaveBeenCalledWith('CREATE code-pushup.config.js');
    });
  });

  describe('Monorepo config', () => {
    const PROJECT_BINDING: PluginSetupBinding = {
      slug: 'test-plugin',
      title: 'Test Plugin',
      packageName: '@code-pushup/test-plugin',
      isRecommended: () => Promise.resolve(true),
      generateConfig: () => ({
        imports: [
          {
            moduleSpecifier: '@code-pushup/test-plugin',
            defaultImport: 'testPlugin',
          },
        ],
        pluginInit: ['testPlugin(),'],
      }),
    };

    const ROOT_BINDING: PluginSetupBinding = {
      slug: 'root-plugin',
      title: 'Root Plugin',
      packageName: '@code-pushup/root-plugin',
      scope: 'root',
      isRecommended: () => Promise.resolve(true),
      generateConfig: () => ({
        imports: [
          {
            moduleSpecifier: '@code-pushup/root-plugin',
            defaultImport: 'rootPlugin',
          },
        ],
        pluginInit: ['rootPlugin(),'],
      }),
    };

    beforeEach(() => {
      vol.fromJSON(
        {
          'tsconfig.json': '{}',
          'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
        },
        MEMFS_VOLUME,
      );
      vi.mocked(listProjects).mockResolvedValue([
        {
          name: 'app-a',
          directory: `${MEMFS_VOLUME}/packages/app-a`,
          relativeDir: 'packages/app-a',
        },
        {
          name: 'app-b',
          directory: `${MEMFS_VOLUME}/packages/app-b`,
          relativeDir: 'packages/app-b',
        },
      ]);
    });

    it('should generate preset and per-project configs', async () => {
      await runSetupWizard([PROJECT_BINDING], {
        yes: true,
        mode: 'monorepo',
        'target-dir': MEMFS_VOLUME,
      });

      await expect(readFile(`${MEMFS_VOLUME}/code-pushup.preset.ts`, 'utf8'))
        .resolves.toMatchInlineSnapshot(`
        "import type { CoreConfig } from '@code-pushup/models';
        import testPlugin from '@code-pushup/test-plugin';

        /**
         * Creates a Code PushUp config for a project.
         * @param project Project name
         */
        export async function createConfig(project: string): Promise<CoreConfig> {
          return {
            plugins: [
              testPlugin(),
            ],
          };
        }
        "
      `);

      await expect(
        readFile(
          `${MEMFS_VOLUME}/packages/app-a/code-pushup.config.ts`,
          'utf8',
        ),
      ).resolves.toMatchInlineSnapshot(`
        "import { createConfig } from '../../code-pushup.preset.js';

        export default await createConfig('app-a');
        "
      `);

      await expect(
        readFile(
          `${MEMFS_VOLUME}/packages/app-b/code-pushup.config.ts`,
          'utf8',
        ),
      ).resolves.toMatchInlineSnapshot(`
        "import { createConfig } from '../../code-pushup.preset.js';

        export default await createConfig('app-b');
        "
      `);

      expect(addCodePushUpCommand).toHaveBeenCalledTimes(2);
    });

    it('should generate root config for root-scoped plugins', async () => {
      await runSetupWizard([PROJECT_BINDING, ROOT_BINDING], {
        yes: true,
        mode: 'monorepo',
        'target-dir': MEMFS_VOLUME,
      });

      await expect(readFile(`${MEMFS_VOLUME}/code-pushup.config.ts`, 'utf8'))
        .resolves.toMatchInlineSnapshot(`
        "import type { CoreConfig } from '@code-pushup/models';
        import rootPlugin from '@code-pushup/root-plugin';

        export default {
          plugins: [
            rootPlugin(),
          ],
        } satisfies CoreConfig;
        "
      `);

      await expect(
        readFile(`${MEMFS_VOLUME}/code-pushup.preset.ts`, 'utf8'),
      ).resolves.toBeTruthy();
    });
  });
});
