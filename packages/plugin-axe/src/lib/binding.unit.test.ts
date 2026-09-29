import { vol } from 'memfs';
import type { PluginAnswer } from '@code-pushup/models';
import {
  MEMFS_VOLUME,
  createMockCodegenInput,
  createMockTree,
} from '@code-pushup/test-utils';
import { resetDevServerUrlCache } from '@code-pushup/utils';
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
  beforeEach(() => {
    vol.reset();
    resetDevServerUrlCache();
  });

  describe('prompts', () => {
    it('should offer preset choices with wcag21aa as default', async () => {
      vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);

      await expect(
        binding.prompts!(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'axe.preset', type: 'select', default: 'wcag21aa' },
      ]);
    });

    it('should default setupScript to false', async () => {
      vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);

      await expect(
        binding.prompts!(MEMFS_VOLUME),
      ).resolves.toIncludeAllPartialMembers([
        { key: 'axe.setupScript', type: 'confirm', default: false },
      ]);
    });

    it('should fall back to localhost:4200 when no dev server config is found', async () => {
      vol.fromJSON({ '.gitkeep': '' }, MEMFS_VOLUME);

      await expect(binding.prompts!(MEMFS_VOLUME)).resolves.toContainEqual(
        expect.objectContaining({
          key: 'axe.urls',
          default: 'http://localhost:4200',
          message: 'Target URL(s) (comma-separated):',
        }),
      );
    });

    it('should detect Vite default URL from vite.config.js', async () => {
      vol.fromJSON({ 'vite.config.js': 'export default {}' }, MEMFS_VOLUME);

      await expect(binding.prompts!(MEMFS_VOLUME)).resolves.toContainEqual(
        expect.objectContaining({
          key: 'axe.urls',
          default: 'http://localhost:5173',
          message:
            'Target URL(s) (detected from vite.config.js, comma-separated):',
        }),
      );
    });
  });

  describe('generateConfig with categories selected', () => {
    it('should declare plugin as a variable for use in category refs', async () => {
      const { pluginDeclaration } = await binding.generateConfig(
        createMockCodegenInput(defaultAnswers, createMockTree()),
      );
      expect(pluginDeclaration).toStrictEqual({
        identifier: 'axe',
        expression: "axePlugin('http://localhost:4200')",
      });
    });

    it('should import axeGroupRefs helper', async () => {
      const { imports } = await binding.generateConfig(
        createMockCodegenInput(defaultAnswers, createMockTree()),
      );
      expect(imports).toStrictEqual([
        expect.objectContaining({ namedImports: ['axeGroupRefs'] }),
      ]);
    });

    it('should produce accessibility category with refs expression', async () => {
      const { categories } = await binding.generateConfig(
        createMockCodegenInput(defaultAnswers, createMockTree()),
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
        createMockCodegenInput(noCategoryAnswers, createMockTree()),
      );
      expect(pluginDeclaration).toBeUndefined();
    });

    it('should not import axeGroupRefs helper', async () => {
      const { imports } = await binding.generateConfig(
        createMockCodegenInput(noCategoryAnswers, createMockTree()),
      );
      expect(imports[0]).not.toHaveProperty('namedImports');
    });

    it('should not produce categories', async () => {
      const { categories } = await binding.generateConfig(
        createMockCodegenInput(noCategoryAnswers, createMockTree()),
      );
      expect(categories).toBeUndefined();
    });
  });

  describe('setup script', () => {
    it('should write setup script file when confirmed', async () => {
      const tree = createMockTree();
      await binding.generateConfig(
        createMockCodegenInput(
          { ...defaultAnswers, 'axe.setupScript': true },
          tree,
        ),
      );
      expect(tree.written.get('./axe-setup.ts')).toContain(
        "import type { Page } from 'playwright-core'",
      );
    });

    it('should include setupScript in plugin call when confirmed', async () => {
      const { pluginDeclaration } = await binding.generateConfig(
        createMockCodegenInput(
          { ...defaultAnswers, 'axe.setupScript': true },
          createMockTree(),
        ),
      );
      expect(pluginDeclaration!.expression).toContain(
        "setupScript: './axe-setup.ts'",
      );
    });

    it('should not write setup script file when declined', async () => {
      const tree = createMockTree();
      await binding.generateConfig(
        createMockCodegenInput(defaultAnswers, tree),
      );
      expect(tree.written.size).toBe(0);
    });
  });

  it('should include non-default preset in plugin call', async () => {
    const { pluginDeclaration } = await binding.generateConfig(
      createMockCodegenInput(
        { ...defaultAnswers, 'axe.preset': 'wcag22aa' },
        createMockTree(),
      ),
    );
    expect(pluginDeclaration!.expression).toContain("preset: 'wcag22aa'");
  });

  it('should format multiple URLs as array', async () => {
    const { pluginDeclaration } = await binding.generateConfig(
      createMockCodegenInput(
        {
          ...defaultAnswers,
          'axe.urls': 'http://localhost:4200/login, http://localhost:4200/home',
        },
        createMockTree(),
      ),
    );
    expect(pluginDeclaration!.expression).toContain(
      "axePlugin(['http://localhost:4200/login', 'http://localhost:4200/home']",
    );
  });
});
