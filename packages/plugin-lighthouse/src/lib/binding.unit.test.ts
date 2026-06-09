import { vol } from 'memfs';
import type { PluginAnswer } from '@code-pushup/models';
import { MEMFS_VOLUME, createMockCodegenInput } from '@code-pushup/test-utils';
import { resetDevServerUrlCache } from '@code-pushup/utils';
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
  beforeEach(() => {
    vol.reset();
    resetDevServerUrlCache();
  });

  describe('prompts', () => {
    it('should select all categories by default', async () => {
      vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);

      await expect(
        binding.prompts!(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        {
          key: 'lighthouse.categories',
          type: 'checkbox',
          default: ['performance', 'a11y', 'best-practices', 'seo'],
        },
      ]);
    });

    it('should fall back to localhost:4200 when no dev server config is found', async () => {
      vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);

      await expect(binding.prompts!(MEMFS_VOLUME)).resolves.toContainEqual(
        expect.objectContaining({
          key: 'lighthouse.urls',
          default: 'http://localhost:4200',
          message: 'Target URL(s) (comma-separated):',
        }),
      );
    });

    it('should detect Next.js default URL from package.json dev script', async () => {
      vol.fromJSON(
        {
          'package.json': JSON.stringify({ scripts: { dev: 'next dev' } }),
        },
        MEMFS_VOLUME,
      );

      await expect(binding.prompts!(MEMFS_VOLUME)).resolves.toContainEqual(
        expect.objectContaining({
          key: 'lighthouse.urls',
          default: 'http://localhost:3000',
          message:
            'Target URL(s) (detected from package.json dev script, comma-separated):',
        }),
      );
    });
  });

  describe('generateConfig with categories selected', () => {
    it('should declare plugin as a variable for use in category refs', () => {
      expect(
        binding.generateConfig(createMockCodegenInput(defaultAnswers))
          .pluginDeclaration,
      ).toEqual({
        identifier: 'lhPlugin',
        expression: "lighthousePlugin('http://localhost:4200')",
      });
    });

    it('should import lighthouseGroupRefs helper', () => {
      expect(
        binding.generateConfig(createMockCodegenInput(defaultAnswers)).imports,
      ).toEqual([
        expect.objectContaining({ namedImports: ['lighthouseGroupRefs'] }),
      ]);
    });

    it('should produce categories with refs expressions for each selected group', () => {
      const { categories } = binding.generateConfig(
        createMockCodegenInput(defaultAnswers),
      );
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
      const { categories } = binding.generateConfig(
        createMockCodegenInput({
          ...defaultAnswers,
          'lighthouse.categories': ['performance', 'seo'],
        }),
      );
      expect(categories).toHaveLength(2);
      expect(categories).toEqual([
        expect.objectContaining({ slug: 'performance' }),
        expect.objectContaining({ slug: 'seo' }),
      ]);
    });

    it('should pass onlyGroups when not all categories are selected', () => {
      const { pluginDeclaration } = binding.generateConfig(
        createMockCodegenInput({
          ...defaultAnswers,
          'lighthouse.categories': ['performance', 'seo'],
        }),
      );
      expect(pluginDeclaration!.expression).toContain(
        "onlyGroups: ['performance', 'seo']",
      );
    });

    it('should omit onlyGroups when all categories are selected', () => {
      const { pluginDeclaration } = binding.generateConfig(
        createMockCodegenInput(defaultAnswers),
      );
      expect(pluginDeclaration!.expression).not.toContain('onlyGroups');
    });

    it('should use custom URL in plugin declaration', () => {
      expect(
        binding.generateConfig(
          createMockCodegenInput({
            ...defaultAnswers,
            'lighthouse.urls': 'https://example.com',
          }),
        ).pluginDeclaration,
      ).toEqual(
        expect.objectContaining({
          expression: "lighthousePlugin('https://example.com')",
        }),
      );
    });

    it('should format multiple URLs as an array', () => {
      expect(
        binding.generateConfig(
          createMockCodegenInput({
            ...defaultAnswers,
            'lighthouse.urls': 'http://localhost:4200, http://localhost:4201',
          }),
        ).pluginDeclaration,
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
        binding.generateConfig(createMockCodegenInput(noCategoryAnswers))
          .pluginDeclaration,
      ).toBeUndefined();
    });

    it('should not import lighthouseGroupRefs helper', () => {
      const { imports } = binding.generateConfig(
        createMockCodegenInput(noCategoryAnswers),
      );
      expect(imports[0]).not.toHaveProperty('namedImports');
    });

    it('should not produce categories', () => {
      expect(
        binding.generateConfig(createMockCodegenInput(noCategoryAnswers))
          .categories,
      ).toBeUndefined();
    });
  });
});
