import { vol } from 'memfs';
import type { PluginAnswer } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { readJsonFile } from '@code-pushup/utils';
import { coverageSetupBinding } from './binding.js';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');
  return {
    ...actual,
    readJsonFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
  };
});

function generateConfig(overrides: Record<string, PluginAnswer> = {}) {
  return coverageSetupBinding.generateConfig({
    'coverage.framework': 'vitest',
    'coverage.configFile': '',
    'coverage.reportPath': 'coverage/lcov.info',
    'coverage.testCommand': 'npx vitest run --coverage.enabled',
    'coverage.types': ['function', 'branch', 'line'],
    'coverage.continueOnFail': true,
    'coverage.categories': true,
    ...overrides,
  });
}

describe('coverageSetupBinding', () => {
  beforeEach(() => {
    vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);
  });

  describe('isRecommended', () => {
    it.each([
      { file: 'vitest.config.ts' },
      { file: 'vite.config.mjs' },
      { file: 'vitest.workspace.cts' },
      { file: 'jest.config.js' },
    ])('should detect $file', async ({ file }) => {
      vol.fromJSON({ [file]: '' }, MEMFS_VOLUME);

      await expect(
        coverageSetupBinding.isRecommended(MEMFS_VOLUME),
      ).resolves.toBeTrue();
    });

    it.each([{ field: 'dependencies' }, { field: 'devDependencies' }])(
      'should detect vitest in $field',
      async ({ field }) => {
        vi.mocked(readJsonFile).mockResolvedValue({
          [field]: { vitest: '^2.0.0' },
        });

        await expect(
          coverageSetupBinding.isRecommended(MEMFS_VOLUME),
        ).resolves.toBeTrue();
      },
    );

    it.each([{ field: 'dependencies' }, { field: 'devDependencies' }])(
      'should detect jest in $field',
      async ({ field }) => {
        vi.mocked(readJsonFile).mockResolvedValue({
          [field]: { jest: '^29.0.0' },
        });

        await expect(
          coverageSetupBinding.isRecommended(MEMFS_VOLUME),
        ).resolves.toBeTrue();
      },
    );

    it('should not recommend when no test framework found', async () => {
      vi.mocked(readJsonFile).mockResolvedValue({});

      await expect(
        coverageSetupBinding.isRecommended(MEMFS_VOLUME),
      ).resolves.toBeFalse();
    });
  });

  describe('prompts', () => {
    it('should detect vitest defaults', async () => {
      vol.fromJSON({ 'vitest.config.ts': '' }, MEMFS_VOLUME);

      await expect(
        coverageSetupBinding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'coverage.framework', default: 'vitest' },
        { key: 'coverage.configFile', default: 'vitest.config.ts' },
        { key: 'coverage.reportPath', default: 'coverage/lcov.info' },
      ]);
    });

    it('should detect jest defaults', async () => {
      vol.fromJSON({ 'jest.config.js': '' }, MEMFS_VOLUME);

      await expect(
        coverageSetupBinding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'coverage.framework', default: 'jest' },
        { key: 'coverage.configFile', default: 'jest.config.js' },
      ]);
    });

    it('should default to other when no framework detected', async () => {
      vi.mocked(readJsonFile).mockResolvedValue({});

      await expect(
        coverageSetupBinding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'coverage.framework', default: 'other' },
        { key: 'coverage.reportPath', default: '' },
        { key: 'coverage.testCommand', default: '' },
      ]);
    });
  });

  describe('generateConfig', () => {
    it('should generate vitest config', () => {
      expect(generateConfig().pluginInit).toMatchInlineSnapshot(`
        "await coveragePlugin({
            reports: ['coverage/lcov.info'],
            coverageToolCommand: { command: 'npx vitest run --coverage.enabled' },
          })"
      `);
    });

    it('should generate jest config', () => {
      const { pluginInit } = generateConfig({
        'coverage.framework': 'jest',
        'coverage.testCommand': 'npx jest --coverage',
      });
      expect(pluginInit).toMatchInlineSnapshot(`
        "await coveragePlugin({
            reports: ['coverage/lcov.info'],
            coverageToolCommand: { command: 'npx jest --coverage' },
          })"
      `);
    });

    it('should omit coverageToolCommand when test command is empty', () => {
      expect(
        generateConfig({ 'coverage.testCommand': '' }).pluginInit,
      ).not.toContain('coverageToolCommand');
    });

    it('should use default report path when empty', () => {
      expect(
        generateConfig({ 'coverage.reportPath': '' }).pluginInit,
      ).toContain("'coverage/lcov.info'");
    });

    it('should use custom report path when provided', () => {
      expect(
        generateConfig({ 'coverage.reportPath': 'dist/coverage/lcov.info' })
          .pluginInit,
      ).toContain("'dist/coverage/lcov.info'");
    });

    it('should omit coverageTypes when all selected', () => {
      expect(generateConfig().pluginInit).not.toContain('coverageTypes');
    });

    it('should include coverageTypes when subset selected', () => {
      expect(
        generateConfig({ 'coverage.types': ['branch', 'line'] }).pluginInit,
      ).toContain("coverageTypes: ['branch', 'line']");
    });

    it('should disable continueOnCommandFail when declined', () => {
      expect(
        generateConfig({ 'coverage.continueOnFail': false }).pluginInit,
      ).toContain('continueOnCommandFail: false');
    });

    it('should omit continueOnCommandFail when default', () => {
      expect(generateConfig().pluginInit).not.toContain(
        'continueOnCommandFail',
      );
    });

    it('should omit categories when declined', () => {
      expect(
        generateConfig({ 'coverage.categories': false }).categories,
      ).toBeUndefined();
    });

    it('should import from @code-pushup/coverage-plugin', () => {
      expect(generateConfig().imports).toEqual([
        {
          moduleSpecifier: '@code-pushup/coverage-plugin',
          defaultImport: 'coveragePlugin',
        },
      ]);
    });
  });

  describe('adjustments', () => {
    it('should target vitest config file', () => {
      const { adjustments } = generateConfig({
        'coverage.framework': 'vitest',
        'coverage.configFile': 'vitest.config.ts',
      });
      expect(adjustments).toHaveLength(1);
      expect(adjustments![0]!.path).toBe('vitest.config.ts');
    });

    it('should target jest config file', () => {
      const { adjustments } = generateConfig({
        'coverage.framework': 'jest',
        'coverage.configFile': 'jest.config.mjs',
      });
      expect(adjustments).toHaveLength(1);
      expect(adjustments![0]!.path).toBe('jest.config.mjs');
    });

    it('should skip for other framework', () => {
      expect(
        generateConfig({ 'coverage.framework': 'other' }).adjustments,
      ).toBeUndefined();
    });

    it('should skip when no config file detected', () => {
      expect(generateConfig().adjustments).toBeUndefined();
    });
  });
});
