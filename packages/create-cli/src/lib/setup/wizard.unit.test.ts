import { vol } from 'memfs';
import { readFile } from 'node:fs/promises';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { logger } from '@code-pushup/utils';
import type { PluginSetupBinding } from './types.js';
import { runSetupWizard } from './wizard.js';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
  input: vi.fn(),
  select: vi.fn(),
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
    pluginInit: 'testPlugin()',
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
});
