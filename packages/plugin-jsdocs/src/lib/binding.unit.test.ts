import type { PluginAnswer } from '@code-pushup/models';
import { jsDocsSetupBinding as binding } from './binding.js';

const defaultAnswers: Record<string, PluginAnswer> = {
  'jsdocs.patterns': 'src/**/*.ts, src/**/*.js, !**/node_modules',
  'jsdocs.categories': true,
};

const noCategoryAnswers: Record<string, PluginAnswer> = {
  ...defaultAnswers,
  'jsdocs.categories': false,
};

describe('jsDocsSetupBinding', () => {
  describe('prompts', () => {
    it('should default to common TypeScript and JavaScript source patterns', async () => {
      await expect(binding.prompts!()).resolves.toIncludeAllPartialMembers([
        {
          key: 'jsdocs.patterns',
          type: 'input',
          default: 'src/**/*.ts, src/**/*.js, !**/node_modules',
        },
      ]);
    });

    it('should offer to add categories by default', async () => {
      await expect(binding.prompts!()).resolves.toIncludeAllPartialMembers([
        { key: 'jsdocs.categories', type: 'confirm', default: true },
      ]);
    });
  });

  describe('generateConfig', () => {
    it('should import from @code-pushup/jsdocs-plugin', () => {
      const { imports } = binding.generateConfig(defaultAnswers);
      expect(imports).toStrictEqual([
        expect.objectContaining({
          defaultImport: 'jsDocsPlugin',
        }),
      ]);
    });

    it('should pass multiple patterns as array to plugin call', () => {
      const { pluginInit } = binding.generateConfig(defaultAnswers);
      expect(pluginInit).toStrictEqual([
        'jsDocsPlugin([',
        "  'src/**/*.ts',",
        "  'src/**/*.js',",
        "  '!**/node_modules',",
        ']),',
      ]);
    });

    it('should pass single pattern as string to plugin call', () => {
      const { pluginInit } = binding.generateConfig({
        ...defaultAnswers,
        'jsdocs.patterns': 'src/**/*.ts',
      });
      expect(pluginInit).toStrictEqual(["jsDocsPlugin('src/**/*.ts'),"]);
    });

    it('should generate Documentation category from documentation-coverage group', () => {
      const { categories } = binding.generateConfig(defaultAnswers);
      expect(categories).toStrictEqual([
        expect.objectContaining({
          slug: 'docs',
          title: 'Documentation',
          refs: [
            expect.objectContaining({
              plugin: 'jsdocs',
              slug: 'documentation-coverage',
            }),
          ],
        }),
      ]);
    });

    it('should omit categories when declined', () => {
      const { categories } = binding.generateConfig(noCategoryAnswers);
      expect(categories).toBeUndefined();
    });
  });
});
