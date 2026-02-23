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
  beforeEach(() => {
    vol.fromJSON({}, MEMFS_VOLUME);
  });

  it('should generate config and log success', async () => {
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

    expect(vol.toJSON(MEMFS_VOLUME)).toStrictEqual({});
    expect(logger.info).toHaveBeenCalledWith('CREATE code-pushup.config.ts');
    expect(logger.info).toHaveBeenCalledWith('Dry run — no files written.');
  });

  it('should generate empty config with no bindings', async () => {
    await runSetupWizard([], {
      yes: true,
      'target-dir': MEMFS_VOLUME,
    });

    await expect(readFile(`${MEMFS_VOLUME}/code-pushup.config.ts`, 'utf8'))
      .resolves.toMatchInlineSnapshot(`
      "import type { CoreConfig } from '@code-pushup/models';

      export default {
        plugins: [],
      } satisfies CoreConfig;
      "
    `);

    expect(logger.info).toHaveBeenCalledWith('CREATE code-pushup.config.ts');
    expect(logger.info).toHaveBeenCalledWith('Setup complete.');
  });
});
