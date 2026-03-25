import type { PluginAnswer } from '@code-pushup/models';
import { lighthouseSetupBinding as binding } from './binding.js';

const defaultAnswers: Record<string, PluginAnswer> = {
  'lighthouse.urls': 'http://localhost:4200',
  'lighthouse.categories': ['performance', 'a11y', 'best-practices', 'seo'],
};

const noCategoryAnswers: Record<string, PluginAnswer> = {
  ...defaultAnswers,
  'lighthouse.categories': [],
};

describe('lighthouseSetupBinding', () => {
  describe('prompts', () => {
    it('should select all categories by default', async () => {
      await expect(binding.prompts!('')).resolves.toIncludeAllPartialMembers([
        {
          key: 'lighthouse.categories',
          type: 'checkbox',
          default: ['performance', 'a11y', 'best-practices', 'seo'],
        },
      ]);
    });
  });

  describe('generateConfig with categories selected', () => {
    it('should declare plugin as a variable for use in category refs', () => {
      expect(binding.generateConfig(defaultAnswers).pluginDeclaration).toEqual({
        identifier: 'lhPlugin',
        expression: "lighthousePlugin('http://localhost:4200')",
      });
    });

    it('should import lighthouseGroupRefs helper', () => {
      expect(binding.generateConfig(defaultAnswers).imports).toEqual([
        expect.objectContaining({ namedImports: ['lighthouseGroupRefs'] }),
      ]);
    });

    it('should produce categories with refs expressions for each selected group', () => {
      const { categories } = binding.generateConfig(defaultAnswers);
      expect(categories).toHaveLength(4);
      expect(categories).toEqual([
        expect.objectContaining({
          slug: 'performance',
          refsExpression: "lighthouseGroupRefs(lhPlugin, 'performance')",
        }),
        expect.objectContaining({
          slug: 'a11y',
          refsExpression: "lighthouseGroupRefs(lhPlugin, 'accessibility')",
        }),
        expect.objectContaining({
          slug: 'best-practices',
          refsExpression: "lighthouseGroupRefs(lhPlugin, 'best-practices')",
        }),
        expect.objectContaining({
          slug: 'seo',
          refsExpression: "lighthouseGroupRefs(lhPlugin, 'seo')",
        }),
      ]);
    });

    it('should only include selected categories', () => {
      const { categories } = binding.generateConfig({
        ...defaultAnswers,
        'lighthouse.categories': ['performance', 'seo'],
      });
      expect(categories).toHaveLength(2);
      expect(categories).toEqual([
        expect.objectContaining({ slug: 'performance' }),
        expect.objectContaining({ slug: 'seo' }),
      ]);
    });

    it('should use custom URL in plugin declaration', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'lighthouse.urls': 'https://example.com',
        }).pluginDeclaration,
      ).toEqual(
        expect.objectContaining({
          expression: "lighthousePlugin('https://example.com')",
        }),
      );
    });

    it('should format multiple URLs as an array', () => {
      expect(
        binding.generateConfig({
          ...defaultAnswers,
          'lighthouse.urls': 'http://localhost:4200, http://localhost:4201',
        }).pluginDeclaration,
      ).toEqual(
        expect.objectContaining({
          expression:
            "lighthousePlugin(['http://localhost:4200', 'http://localhost:4201'])",
        }),
      );
    });
  });

  describe('generateConfig without categories selected', () => {
    it('should not declare plugin as a variable', () => {
      expect(
        binding.generateConfig(noCategoryAnswers).pluginDeclaration,
      ).toBeUndefined();
    });

    it('should not import lighthouseGroupRefs helper', () => {
      const { imports } = binding.generateConfig(noCategoryAnswers);
      expect(imports[0]).not.toHaveProperty('namedImports');
    });

    it('should not produce categories', () => {
      expect(
        binding.generateConfig(noCategoryAnswers).categories,
      ).toBeUndefined();
    });
  });
});
