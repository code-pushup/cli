import { vol } from 'memfs';
import type { PluginAnswer } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { typescriptSetupBinding as binding } from './binding.js';

const defaultAnswers: Record<string, PluginAnswer> = {
  'typescript.tsconfig': 'tsconfig.json',
  'typescript.categories': true,
};

describe('typescriptSetupBinding', () => {
  beforeEach(() => {
    vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);
  });

  describe('isRecommended', () => {
    it('should recommend when tsconfig.json exists', async () => {
      vol.fromJSON({ 'tsconfig.json': '{}' }, MEMFS_VOLUME);

      await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeTrue();
    });

    it('should recommend when tsconfig.base.json exists', async () => {
      vol.fromJSON({ 'tsconfig.base.json': '{}' }, MEMFS_VOLUME);

      await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeTrue();
    });

    it('should not recommend when no tsconfig found', async () => {
      await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeFalse();
    });
  });

  describe('prompts', () => {
    it('should detect tsconfig.json as default', async () => {
      vol.fromJSON({ 'tsconfig.json': '{}' }, MEMFS_VOLUME);

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'typescript.tsconfig', default: 'tsconfig.json' },
      ]);
    });

    it('should detect tsconfig.base.json when present', async () => {
      vol.fromJSON({ 'tsconfig.base.json': '{}' }, MEMFS_VOLUME);

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'typescript.tsconfig', default: 'tsconfig.base.json' },
      ]);
    });

    it('should detect tsconfig.app.json when present', async () => {
      vol.fromJSON({ 'tsconfig.app.json': '{}' }, MEMFS_VOLUME);

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'typescript.tsconfig', default: 'tsconfig.app.json' },
      ]);
    });

    it('should default to tsconfig.json when no tsconfig found', async () => {
      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'typescript.tsconfig', default: 'tsconfig.json' },
      ]);
    });

    it('should default categories confirmation to true', async () => {
      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'typescript.categories', type: 'confirm', default: true },
      ]);
    });
  });

  describe('generateConfig', () => {
    it('should omit tsconfig option when using default tsconfig.json', () => {
      expect(binding.generateConfig(defaultAnswers).pluginInit).toEqual([
        'typescriptPlugin(),',
      ]);
    });

    it('should include tsconfig when non-default path provided', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'typescript.tsconfig': 'tsconfig.base.json',
        }).pluginInit,
      ).toEqual([
        'typescriptPlugin({',
        "  tsconfig: 'tsconfig.base.json',",
        '}),',
      ]);
    });

    it('should generate bug-prevention category from problems group when confirmed', () => {
      expect(binding.generateConfig(defaultAnswers).categories).toEqual([
        expect.objectContaining({
          slug: 'bug-prevention',
          refs: [
            expect.objectContaining({
              type: 'group',
              plugin: 'typescript',
              slug: 'problems',
            }),
          ],
        }),
      ]);
    });

    it('should omit categories when declined', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'typescript.categories': false,
        }).categories,
      ).toBeUndefined();
    });

    it('should import from @code-pushup/typescript-plugin', () => {
      expect(binding.generateConfig(defaultAnswers).imports).toEqual([
        {
          moduleSpecifier: '@code-pushup/typescript-plugin',
          defaultImport: 'typescriptPlugin',
        },
      ]);
    });
  });
});
