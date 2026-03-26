import { vol } from 'memfs';
import type { PluginAnswer } from '@code-pushup/models';
import { MEMFS_VOLUME, createMockTree } from '@code-pushup/test-utils';
import { readJsonFile } from '@code-pushup/utils';
import { coverageSetupBinding as binding } from './binding.js';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');
  return {
    ...actual,
    readJsonFile: vi.fn().mockRejectedValue(new Error('ENOENT')),
  };
});

const defaultAnswers: Record<string, PluginAnswer> = {
  'coverage.framework': 'vitest',
  'coverage.configFile': '',
  'coverage.reportPath': 'coverage/lcov.info',
  'coverage.testCommand': 'npx vitest run --coverage.enabled',
  'coverage.types': ['function', 'branch', 'line'],
  'coverage.continueOnFail': true,
  'coverage.categories': true,
};

describe('coverageSetupBinding', () => {
  beforeEach(() => {
    vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);
  });

  describe('isRecommended', () => {
    it.each([
      'vitest.config.ts',
      'vite.config.mjs',
      'vitest.workspace.cts',
      'jest.config.js',
    ])('should detect %s', async file => {
      vol.fromJSON({ [file]: '' }, MEMFS_VOLUME);

      await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeTrue();
    });

    it.each(['dependencies', 'devDependencies'])(
      'should detect vitest in %s',
      async field => {
        vi.mocked(readJsonFile).mockResolvedValue({
          [field]: { vitest: '^2.0.0' },
        });

        await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeTrue();
      },
    );

    it.each(['dependencies', 'devDependencies'])(
      'should detect jest in %s',
      async field => {
        vi.mocked(readJsonFile).mockResolvedValue({
          [field]: { jest: '^29.0.0' },
        });

        await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeTrue();
      },
    );

    it('should not recommend when no test framework found', async () => {
      vi.mocked(readJsonFile).mockResolvedValue({});

      await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeFalse();
    });
  });

  describe('prompts', () => {
    it('should detect vitest defaults', async () => {
      vol.fromJSON({ 'vitest.config.ts': '' }, MEMFS_VOLUME);

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'coverage.framework', default: 'vitest' },
        { key: 'coverage.configFile', default: 'vitest.config.ts' },
        { key: 'coverage.reportPath', default: 'coverage/lcov.info' },
      ]);
    });

    it('should detect jest defaults', async () => {
      vol.fromJSON({ 'jest.config.js': '' }, MEMFS_VOLUME);

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'coverage.framework', default: 'jest' },
        { key: 'coverage.configFile', default: 'jest.config.js' },
      ]);
    });

    it('should default to other when no framework detected', async () => {
      vi.mocked(readJsonFile).mockResolvedValue({});

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'coverage.framework', default: 'other' },
        { key: 'coverage.reportPath', default: '' },
        { key: 'coverage.testCommand', default: '' },
      ]);
    });
  });

  describe('generateConfig', () => {
    it('should generate vitest config', async () => {
      const { pluginInit } = await binding.generateConfig(defaultAnswers);
      expect(pluginInit).toEqual([
        '// NOTE: Ensure your test config includes "lcov" in coverage reporters.',
        'await coveragePlugin({',
        "  reports: ['coverage/lcov.info'],",
        "  coverageToolCommand: { command: 'npx vitest run --coverage.enabled' },",
        '}),',
      ]);
    });

    it('should generate jest config', async () => {
      const { pluginInit } = await binding.generateConfig({
        ...defaultAnswers,
        'coverage.framework': 'jest',
        'coverage.testCommand': 'npx jest --coverage',
      });
      expect(pluginInit).toEqual([
        '// NOTE: Ensure your test config includes "lcov" in coverage reporters.',
        'await coveragePlugin({',
        "  reports: ['coverage/lcov.info'],",
        "  coverageToolCommand: { command: 'npx jest --coverage' },",
        '}),',
      ]);
    });

    it('should omit coverageToolCommand when test command is empty', async () => {
      const { pluginInit } = await binding.generateConfig({
        ...defaultAnswers,
        'coverage.testCommand': '',
      });
      expect(pluginInit).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('coverageToolCommand'),
        ]),
      );
    });

    it('should use default report path when empty', async () => {
      const { pluginInit } = await binding.generateConfig({
        ...defaultAnswers,
        'coverage.reportPath': '',
      });
      expect(pluginInit).toEqual(
        expect.arrayContaining([
          expect.stringContaining("'coverage/lcov.info'"),
        ]),
      );
    });

    it('should use custom report path when provided', async () => {
      const { pluginInit } = await binding.generateConfig({
        ...defaultAnswers,
        'coverage.reportPath': 'dist/coverage/lcov.info',
      });
      expect(pluginInit).toEqual(
        expect.arrayContaining([
          expect.stringContaining("'dist/coverage/lcov.info'"),
        ]),
      );
    });

    it('should omit coverageTypes when all selected', async () => {
      const { pluginInit } = await binding.generateConfig(defaultAnswers);
      expect(pluginInit).not.toEqual(
        expect.arrayContaining([expect.stringContaining('coverageTypes')]),
      );
    });

    it('should include coverageTypes when subset selected', async () => {
      const { pluginInit } = await binding.generateConfig({
        ...defaultAnswers,
        'coverage.types': ['branch', 'line'],
      });
      expect(pluginInit).toEqual(
        expect.arrayContaining([
          expect.stringContaining("coverageTypes: ['branch', 'line']"),
        ]),
      );
    });

    it('should disable continueOnCommandFail when declined', async () => {
      const { pluginInit } = await binding.generateConfig({
        ...defaultAnswers,
        'coverage.continueOnFail': false,
      });
      expect(pluginInit).toEqual(
        expect.arrayContaining([
          expect.stringContaining('continueOnCommandFail: false'),
        ]),
      );
    });

    it('should omit continueOnCommandFail when default', async () => {
      const { pluginInit } = await binding.generateConfig(defaultAnswers);
      expect(pluginInit).not.toEqual(
        expect.arrayContaining([
          expect.stringContaining('continueOnCommandFail'),
        ]),
      );
    });

    it('should omit categories when declined', async () => {
      const { categories } = await binding.generateConfig({
        ...defaultAnswers,
        'coverage.categories': false,
      });
      expect(categories).toBeUndefined();
    });

    it('should import from @code-pushup/coverage-plugin', async () => {
      const { imports } = await binding.generateConfig(defaultAnswers);
      expect(imports).toEqual([
        {
          moduleSpecifier: '@code-pushup/coverage-plugin',
          defaultImport: 'coveragePlugin',
        },
      ]);
    });
  });

  describe('lcov reporter configuration', () => {
    const vitestAnswers = {
      ...defaultAnswers,
      'coverage.framework': 'vitest',
      'coverage.configFile': 'vitest.config.ts',
    } as const;

    it('should not include comment when lcov is already present', async () => {
      const tree = createMockTree({
        'vitest.config.ts':
          "export default { test: { coverage: { reporter: ['lcov'] } } };",
      });
      const { pluginInit } = await binding.generateConfig(vitestAnswers, tree);
      expect(pluginInit).not.toEqual(
        expect.arrayContaining([expect.stringContaining('NOTE')]),
      );
    });

    it('should not include comment when lcov is successfully added', async () => {
      const tree = createMockTree({
        'vitest.config.ts':
          "import { defineConfig } from 'vitest/config';\nexport default defineConfig({ test: { coverage: { reporter: ['text'] } } });",
      });
      const { pluginInit } = await binding.generateConfig(vitestAnswers, tree);
      expect(pluginInit).not.toEqual(
        expect.arrayContaining([expect.stringContaining('NOTE')]),
      );
      expect(tree.written.get('vitest.config.ts')).toContain('lcov');
    });

    it('should include comment when framework is other', async () => {
      const { pluginInit } = await binding.generateConfig({
        ...defaultAnswers,
        'coverage.framework': 'other',
      });
      expect(pluginInit).toEqual(
        expect.arrayContaining([expect.stringContaining('NOTE')]),
      );
    });

    it('should include comment when config file cannot be read', async () => {
      const tree = createMockTree({});
      const { pluginInit } = await binding.generateConfig(vitestAnswers, tree);
      expect(pluginInit).toEqual(
        expect.arrayContaining([expect.stringContaining('NOTE')]),
      );
    });

    it('should include comment when magicast cannot modify the file', async () => {
      const tree = createMockTree({
        'jest.config.js': "module.exports = { coverageReporters: ['text'] };",
      });
      const { pluginInit } = await binding.generateConfig(
        {
          ...defaultAnswers,
          'coverage.framework': 'jest',
          'coverage.configFile': 'jest.config.js',
        },
        tree,
      );
      expect(pluginInit).toEqual(
        expect.arrayContaining([expect.stringContaining('NOTE')]),
      );
    });
  });
});
