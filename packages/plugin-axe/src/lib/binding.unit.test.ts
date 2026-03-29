import type { PluginAnswer } from '@code-pushup/models';
import { createMockTree } from '@code-pushup/test-utils';
import { axeSetupBinding as binding } from './binding.js';

const defaultAnswers: Record<string, PluginAnswer> = {
  'axe.urls': 'http://localhost:4200',
  'axe.preset': 'wcag21aa',
  'axe.setupScript': false,
  'axe.categories': true,
};

const noCategoryAnswers: Record<string, PluginAnswer> = {
  ...defaultAnswers,
  'axe.categories': false,
};

describe('axeSetupBinding', () => {
  describe('prompts', () => {
    it('should offer preset choices with wcag21aa as default', async () => {
      await expect(binding.prompts!()).resolves.toIncludeAllPartialMembers([
        { key: 'axe.preset', type: 'select', default: 'wcag21aa' },
      ]);
    });

    it('should default setupScript to false', async () => {
      await expect(binding.prompts!()).resolves.toIncludeAllPartialMembers([
        { key: 'axe.setupScript', type: 'confirm', default: false },
      ]);
    });
  });

  describe('generateConfig with categories selected', () => {
    it('should declare plugin as a variable for use in category refs', async () => {
      const { pluginDeclaration } = await binding.generateConfig(
        defaultAnswers,
        createMockTree(),
      );
      expect(pluginDeclaration).toStrictEqual({
        identifier: 'axe',
        expression: "axePlugin('http://localhost:4200')",
      });
    });

    it('should import axeGroupRefs helper', async () => {
      const { imports } = await binding.generateConfig(
        defaultAnswers,
        createMockTree(),
      );
      expect(imports).toStrictEqual([
        expect.objectContaining({ namedImports: ['axeGroupRefs'] }),
      ]);
    });

    it('should produce accessibility category with refs expression', async () => {
      const { categories } = await binding.generateConfig(
        defaultAnswers,
        createMockTree(),
      );
      expect(categories).toStrictEqual([
        expect.objectContaining({
          slug: 'a11y',
          refsExpression: 'axeGroupRefs(axe)',
        }),
      ]);
    });
  });

  describe('generateConfig without categories selected', () => {
    it('should not declare plugin as a variable', async () => {
      const { pluginDeclaration } = await binding.generateConfig(
        noCategoryAnswers,
        createMockTree(),
      );
      expect(pluginDeclaration).toBeUndefined();
    });

    it('should not import axeGroupRefs helper', async () => {
      const { imports } = await binding.generateConfig(
        noCategoryAnswers,
        createMockTree(),
      );
      expect(imports[0]).not.toHaveProperty('namedImports');
    });

    it('should not produce categories', async () => {
      const { categories } = await binding.generateConfig(
        noCategoryAnswers,
        createMockTree(),
      );
      expect(categories).toBeUndefined();
    });
  });

  describe('setup script', () => {
    it('should write setup script file when confirmed', async () => {
      const tree = createMockTree();
      await binding.generateConfig(
        { ...defaultAnswers, 'axe.setupScript': true },
        tree,
      );
      expect(tree.written.get('./axe-setup.ts')).toContain(
        "import type { Page } from 'playwright-core'",
      );
    });

    it('should include setupScript in plugin call when confirmed', async () => {
      const { pluginDeclaration } = await binding.generateConfig(
        { ...defaultAnswers, 'axe.setupScript': true },
        createMockTree(),
      );
      expect(pluginDeclaration!.expression).toContain(
        "setupScript: './axe-setup.ts'",
      );
    });

    it('should not write setup script file when declined', async () => {
      const tree = createMockTree();
      await binding.generateConfig(defaultAnswers, tree);
      expect(tree.written.size).toBe(0);
    });
  });

  it('should include non-default preset in plugin call', async () => {
    const { pluginDeclaration } = await binding.generateConfig(
      { ...defaultAnswers, 'axe.preset': 'wcag22aa' },
      createMockTree(),
    );
    expect(pluginDeclaration!.expression).toContain("preset: 'wcag22aa'");
  });

  it('should format multiple URLs as array', async () => {
    const { pluginDeclaration } = await binding.generateConfig(
      {
        ...defaultAnswers,
        'axe.urls': 'http://localhost:4200/login, http://localhost:4200/home',
      },
      createMockTree(),
    );
    expect(pluginDeclaration!.expression).toContain(
      "axePlugin(['http://localhost:4200/login', 'http://localhost:4200/home']",
    );
  });
});
