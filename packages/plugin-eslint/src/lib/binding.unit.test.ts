import { vol } from 'memfs';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { directoryExists, readJsonFile } from '@code-pushup/utils';
import { eslintSetupBinding } from './binding.js';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');
  return {
    ...actual,
    directoryExists: vi.fn().mockResolvedValue(false),
    readJsonFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
  };
});

describe('eslintSetupBinding', () => {
  beforeEach(() => {
    vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);
  });

  describe('isRecommended', () => {
    it('should detect flat config file', async () => {
      vol.fromJSON({ 'eslint.config.js': '' }, MEMFS_VOLUME);

      await expect(
        eslintSetupBinding.isRecommended(MEMFS_VOLUME),
      ).resolves.toBeTrue();
    });

    it('should detect legacy config file', async () => {
      vol.fromJSON({ '.eslintrc.json': '' }, MEMFS_VOLUME);

      await expect(
        eslintSetupBinding.isRecommended(MEMFS_VOLUME),
      ).resolves.toBeTrue();
    });

    it.each([{ field: 'dependencies' }, { field: 'devDependencies' }])(
      'should detect eslint in $field',
      async ({ field }) => {
        vi.mocked(readJsonFile).mockResolvedValue({
          [field]: { eslint: '^9.0.0' },
        });

        await expect(
          eslintSetupBinding.isRecommended(MEMFS_VOLUME),
        ).resolves.toBeTrue();
      },
    );

    it('should not recommend when no config or dependency found', async () => {
      vi.mocked(readJsonFile).mockResolvedValue({});

      await expect(
        eslintSetupBinding.isRecommended(MEMFS_VOLUME),
      ).resolves.toBeFalse();
    });
  });

  describe('prompts', () => {
    it('should pre-fill eslintrc with existing config filename', async () => {
      vol.fromJSON({ 'eslint.config.ts': '' }, MEMFS_VOLUME);

      await expect(
        eslintSetupBinding.prompts(MEMFS_VOLUME),
      ).resolves.toContainEqual(
        expect.objectContaining({
          key: 'eslint.eslintrc',
          default: 'eslint.config.ts',
        }),
      );
    });

    it('should leave eslintrc empty when no config file exists', async () => {
      await expect(
        eslintSetupBinding.prompts(MEMFS_VOLUME),
      ).resolves.toContainEqual(
        expect.objectContaining({ key: 'eslint.eslintrc', default: '' }),
      );
    });

    it('should default patterns to "src" when src directory exists', async () => {
      vi.mocked(directoryExists).mockResolvedValue(true);

      await expect(
        eslintSetupBinding.prompts(MEMFS_VOLUME),
      ).resolves.toContainEqual(
        expect.objectContaining({ key: 'eslint.patterns', default: 'src' }),
      );
    });

    it('should default patterns to "." when no src directory exists', async () => {
      vi.mocked(directoryExists).mockResolvedValue(false);

      await expect(
        eslintSetupBinding.prompts(MEMFS_VOLUME),
      ).resolves.toContainEqual(
        expect.objectContaining({ key: 'eslint.patterns', default: '.' }),
      );
    });

    it('should expose eslintrc, patterns and categories prompts', async () => {
      const descriptors = await eslintSetupBinding.prompts(MEMFS_VOLUME);
      expect(descriptors).toEqual([
        expect.objectContaining({ key: 'eslint.eslintrc' }),
        expect.objectContaining({ key: 'eslint.patterns' }),
        expect.objectContaining({ key: 'eslint.categories' }),
      ]);
    });
  });

  describe('generateConfig', () => {
    it('should omit eslintrc for standard config filenames', () => {
      expect(
        eslintSetupBinding.generateConfig({
          'eslint.eslintrc': 'eslint.config.ts',
          'eslint.patterns': 'src',
          'eslint.categories': true,
        }).pluginInit,
      ).toBe("await eslintPlugin({ patterns: 'src' })");
    });

    it('should include eslintrc for non-standard config paths', () => {
      expect(
        eslintSetupBinding.generateConfig({
          'eslint.eslintrc': 'configs/eslint.config.js',
          'eslint.patterns': 'src',
          'eslint.categories': false,
        }).pluginInit,
      ).toBe(
        "await eslintPlugin({ eslintrc: 'configs/eslint.config.js', patterns: 'src' })",
      );
    });

    it('should format comma-separated patterns as array', () => {
      expect(
        eslintSetupBinding.generateConfig({
          'eslint.eslintrc': '',
          'eslint.patterns': 'src, lib',
          'eslint.categories': false,
        }).pluginInit,
      ).toBe("await eslintPlugin({ patterns: ['src', 'lib'] })");
    });

    it('should produce no-arg call when no options provided', () => {
      expect(
        eslintSetupBinding.generateConfig({
          'eslint.eslintrc': '',
          'eslint.patterns': '',
          'eslint.categories': false,
        }).pluginInit,
      ).toBe('await eslintPlugin()');
    });

    it('should include categories when user confirms', () => {
      expect(
        eslintSetupBinding.generateConfig({
          'eslint.eslintrc': '',
          'eslint.patterns': '',
          'eslint.categories': true,
        }).categories,
      ).toHaveLength(2);
    });

    it('should omit categories when user declines', () => {
      expect(
        eslintSetupBinding.generateConfig({
          'eslint.eslintrc': '',
          'eslint.patterns': '',
          'eslint.categories': false,
        }).categories,
      ).toBeUndefined();
    });

    it('should import from @code-pushup/eslint-plugin', () => {
      expect(
        eslintSetupBinding.generateConfig({
          'eslint.eslintrc': '',
          'eslint.patterns': '',
          'eslint.categories': false,
        }).imports,
      ).toEqual([
        {
          moduleSpecifier: '@code-pushup/eslint-plugin',
          defaultImport: 'eslintPlugin',
        },
      ]);
    });
  });
});
