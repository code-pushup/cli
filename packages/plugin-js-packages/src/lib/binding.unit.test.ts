import { vol } from 'memfs';
import type { PluginAnswer } from '@code-pushup/models';
import { MEMFS_VOLUME } from '@code-pushup/test-utils';
import { jsPackagesSetupBinding as binding } from './binding.js';

const defaultAnswers: Record<string, PluginAnswer> = {
  'js-packages.packageManager': 'npm',
  'js-packages.checks': ['audit', 'outdated'],
  'js-packages.dependencyGroups': ['prod', 'dev'],
  'js-packages.categories': true,
};

describe('jsPackagesSetupBinding', () => {
  beforeEach(() => {
    vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);
  });

  describe('isRecommended', () => {
    it('should recommend when package.json exists', async () => {
      vol.fromJSON({ 'package.json': '{}' }, MEMFS_VOLUME);

      await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeTrue();
    });

    it('should not recommend when package.json is missing', async () => {
      await expect(binding.isRecommended(MEMFS_VOLUME)).resolves.toBeFalse();
    });
  });

  describe('prompts', () => {
    it('should detect npm from package-lock.json', async () => {
      vol.fromJSON({ 'package-lock.json': '' }, MEMFS_VOLUME);

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'js-packages.packageManager', default: 'npm' },
      ]);
    });

    it('should detect pnpm from pnpm-lock.yaml', async () => {
      vol.fromJSON({ 'pnpm-lock.yaml': '' }, MEMFS_VOLUME);

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'js-packages.packageManager', default: 'pnpm' },
      ]);
    });

    it('should detect npm from packageManager field in package.json', async () => {
      vol.fromJSON(
        { 'package.json': JSON.stringify({ packageManager: 'npm@10.0.0' }) },
        MEMFS_VOLUME,
      );

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'js-packages.packageManager', default: 'npm' },
      ]);
    });

    it('should detect yarn-modern from packageManager field in package.json', async () => {
      vol.fromJSON(
        { 'package.json': JSON.stringify({ packageManager: 'yarn@4.0.0' }) },
        MEMFS_VOLUME,
      );

      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'js-packages.packageManager', default: 'yarn-modern' },
      ]);
    });

    it('should default to npm when no lock file or packageManager field is found', async () => {
      await expect(
        binding.prompts(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'js-packages.packageManager', default: 'npm' },
      ]);
    });
  });

  describe('generateConfig', () => {
    it('should always include packageManager in plugin init', () => {
      expect(binding.generateConfig(defaultAnswers).pluginInit).toEqual(
        expect.arrayContaining([
          expect.stringContaining("packageManager: 'npm'"),
        ]),
      );
    });

    it('should omit checks when all defaults (audit and outdated) are selected', () => {
      expect(binding.generateConfig(defaultAnswers).pluginInit).not.toEqual(
        expect.arrayContaining([expect.stringContaining('checks')]),
      );
    });

    it('should include checks when only audit is selected', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'js-packages.checks': ['audit'],
        }).pluginInit,
      ).toEqual(
        expect.arrayContaining([expect.stringContaining("checks: ['audit']")]),
      );
    });

    it('should omit dependencyGroups when default prod and dev are selected', () => {
      expect(binding.generateConfig(defaultAnswers).pluginInit).not.toEqual(
        expect.arrayContaining([expect.stringContaining('dependencyGroups')]),
      );
    });

    it('should include dependencyGroups when optionalDependencies are added', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'js-packages.dependencyGroups': ['prod', 'dev', 'optional'],
        }).pluginInit,
      ).toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            "dependencyGroups: ['prod', 'dev', 'optional']",
          ),
        ]),
      );
    });

    it('should generate security category for audit check', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'js-packages.checks': ['audit'],
        }).categories,
      ).toEqual([expect.objectContaining({ slug: 'security' })]);
    });

    it('should generate updates category for outdated check', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'js-packages.checks': ['outdated'],
        }).categories,
      ).toEqual([expect.objectContaining({ slug: 'updates' })]);
    });

    it('should generate both categories when audit and outdated checks are selected', () => {
      expect(binding.generateConfig(defaultAnswers).categories).toEqual([
        expect.objectContaining({ slug: 'security' }),
        expect.objectContaining({ slug: 'updates' }),
      ]);
    });

    it('should use package manager as prefix in category group refs', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'js-packages.packageManager': 'pnpm',
        }).categories,
      ).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            refs: [expect.objectContaining({ slug: 'pnpm-audit' })],
          }),
          expect.objectContaining({
            refs: [expect.objectContaining({ slug: 'pnpm-outdated' })],
          }),
        ]),
      );
    });

    it('should omit categories when declined', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'js-packages.categories': false,
        }).categories,
      ).toBeUndefined();
    });

    it('should import from @code-pushup/js-packages-plugin', () => {
      expect(binding.generateConfig(defaultAnswers).imports).toEqual([
        {
          moduleSpecifier: '@code-pushup/js-packages-plugin',
          defaultImport: 'jsPackagesPlugin',
        },
      ]);
    });
  });
});
