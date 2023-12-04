import { vol } from 'memfs';
import type { SpyInstance } from 'vitest';
import { findCodePushupEslintrc } from './utils';

describe('find code-pushup.eslintrc.* file', () => {
  const MEMFS_VOLUME = '/test';
  let cwdSpy: SpyInstance;

  beforeAll(() => {
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(MEMFS_VOLUME);
  });

  afterAll(() => {
    cwdSpy.mockRestore();
  });

  it('should find code-pushup.eslinrc.json', async () => {
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
      findCodePushupEslintrc({ root: 'packages/cli' }),
    ).resolves.toBe('./packages/cli/code-pushup.eslintrc.json');
  });

  it('should find code-pushup.eslinrc.js', async () => {
    vol.fromJSON(
      {
        'packages/cli/code-pushup.eslintrc.json':
          '{ "extends": "@code-pushup" }',
        'packages/core/code-pushup.eslintrc.js':
          "module.exports = { extends: '@code-pushup' };",
      },
      MEMFS_VOLUME,
    );

    await expect(
      findCodePushupEslintrc({ root: 'packages/core' }),
    ).resolves.toBe('./packages/core/code-pushup.eslintrc.js');
  });

  it('should look for JSON extension before JavaScript', async () => {
    vol.fromJSON(
      {
        'libs/utils/code-pushup.eslintrc.js':
          "module.exports = { extends: '@code-pushup' };",
        'libs/utils/code-pushup.eslintrc.json': '{ "extends": "@code-pushup" }',
      },
      MEMFS_VOLUME,
    );

    await expect(findCodePushupEslintrc({ root: 'libs/utils' })).resolves.toBe(
      './libs/utils/code-pushup.eslintrc.json',
    );
  });

  it('should look for JavaScript extensions before YAML', async () => {
    vol.fromJSON(
      {
        'libs/utils/code-pushup.eslintrc.cjs':
          "module.exports = { extends: '@code-pushup' };",
        'libs/utils/code-pushup.eslintrc.yml': '- extends: "@code-pushup"\n',
      },
      MEMFS_VOLUME,
    );

    await expect(findCodePushupEslintrc({ root: 'libs/utils' })).resolves.toBe(
      './libs/utils/code-pushup.eslintrc.cjs',
    );
  });

  it('should return null if not found', async () => {
    vol.fromJSON({}, MEMFS_VOLUME);

    await expect(
      findCodePushupEslintrc({ root: 'libs/utils' }),
    ).resolves.toBeNull();
  });
});
