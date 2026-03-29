import type {
  CategoryConfig,
  CoreConfig,
  PluginConfig,
} from '@code-pushup/models';
import { mergeCategoriesBySlug, mergeConfigs } from './merge-configs.js';

const MOCK_CONFIG_PERSIST = {
  persist: {
    outputDir: '.code-pushup/packages/app',
    format: ['json', 'md'],
  },
} as CoreConfig;

const MOCK_JUST_ESLINT_PLUGIN = {
  slug: 'eslint',
  title: 'ESLint',
  icon: 'eslint',
  description: 'Mock Code PushUp ESLint plugin',
  docsUrl: 'https://www.npmjs.com/package/@code-pushup/eslint-plugin',
  packageName: '@code-pushup/eslint-plugin',
  version: '0.0.0',

  audits: [
    {
      slug: 'no-const-assign',
      title: 'Disallow reassigning `const` variables',
      description: 'ESLint rule **no-const-assign**.',
      docsUrl: 'https://eslint.org/docs/latest/rules/no-const-assign',
    },
    {
      slug: 'no-debugger',
      title: 'Disallow the use of `debugger`',
      description: 'ESLint rule **no-debugger**.',
      docsUrl: 'https://eslint.org/docs/latest/rules/no-debugger',
    },
  ],

  groups: [
    {
      slug: 'problems',
      title: 'Problems',
      description:
        'Code that either will cause an error or may cause confusing behavior.',
      refs: [
        { slug: 'no-const-assign', weight: 1 },
        { slug: 'no-debugger', weight: 1 },
      ],
    },
  ],

  runner: {
    command: 'node',
    args: ['bin.js'],
    outputFile: 'node_modules/.code-pushup/runner-output.json',
  },
} as const satisfies PluginConfig;

const MOCK_CONFIG_FULL_ESLINT: CoreConfig = {
  plugins: [MOCK_JUST_ESLINT_PLUGIN],
};

const MOCK_CONFIG_NX_VALIDATORS: CoreConfig = {
  plugins: [{ slug: 'my-plugin' } as PluginConfig],
  categories: [
    {
      slug: 'nx-validators',
      title: 'Workspace Validation',
      refs: [],
    },
  ],
};

const MOCK_CONFIG_BASIC_PLUGIN: CoreConfig = {
  plugins: [{ slug: 'basic-plugin' } as PluginConfig],
  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [
        { type: 'group', plugin: 'basic-plugin', slug: 'problems', weight: 1 },
      ],
    },
    {
      slug: 'code-style',
      title: 'Code style',
      refs: [
        {
          type: 'group',
          plugin: 'basic-plugin',
          slug: 'suggestions',
          weight: 1,
        },
      ],
    },
  ],
};

const MOCK_UPLOAD_CONFIG = {
  upload: {
    server: 'https://portal:80/graphql',
    apiKey: 'cp_apiKey',
    organization: 'entain',
    project: 'fe-monorepo',
  },
} as CoreConfig;

describe('mergeObjects', () => {
  it('should merge nx-validators plugin into empty config', () => {
    expect(mergeConfigs({} as CoreConfig, MOCK_CONFIG_NX_VALIDATORS)).toEqual({
      plugins: [{ slug: 'my-plugin' } as PluginConfig],
      categories: [
        {
          slug: 'nx-validators',
          title: 'Workspace Validation',
          refs: [],
        },
      ],
    });
  });

  it('should merge nx-validators plugin into persist config', () => {
    expect(
      mergeConfigs(MOCK_CONFIG_PERSIST, MOCK_CONFIG_NX_VALIDATORS),
    ).toEqual({ ...MOCK_CONFIG_PERSIST, ...MOCK_CONFIG_NX_VALIDATORS });
  });

  it('should merge eslint plugin into config with configured nx-validators plugin', () => {
    expect(
      mergeConfigs(
        MOCK_CONFIG_PERSIST,
        MOCK_CONFIG_NX_VALIDATORS,
        MOCK_CONFIG_BASIC_PLUGIN,
      ),
    ).toEqual({
      persist: {
        outputDir: '.code-pushup/packages/app',
        format: ['json', 'md'],
      },
      plugins: [
        { slug: 'my-plugin' } as PluginConfig,
        { slug: 'basic-plugin' } as PluginConfig,
      ],
      categories: [
        {
          slug: 'nx-validators',
          title: 'Workspace Validation',
          refs: [],
        },
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          refs: [
            {
              type: 'group',
              plugin: 'basic-plugin',
              slug: 'problems',
              weight: 1,
            },
          ],
        },
        {
          slug: 'code-style',
          title: 'Code style',
          refs: [
            {
              type: 'group',
              plugin: 'basic-plugin',
              slug: 'suggestions',
              weight: 1,
            },
          ],
        },
      ],
    });
  });

  it('should merge upload config properties', () => {
    expect(
      mergeConfigs(
        MOCK_CONFIG_PERSIST,
        MOCK_CONFIG_BASIC_PLUGIN,
        MOCK_UPLOAD_CONFIG,
      ),
    ).toEqual({
      ...MOCK_CONFIG_PERSIST,
      ...MOCK_CONFIG_BASIC_PLUGIN,
      ...MOCK_UPLOAD_CONFIG,
    });
  });

  it('should merge upload configs', () => {
    expect(
      mergeConfigs(
        { upload: { timeout: 10_000 } } as CoreConfig,
        MOCK_UPLOAD_CONFIG,
      ),
    ).toEqual({
      plugins: [],
      upload: { ...MOCK_UPLOAD_CONFIG.upload, timeout: 10_000 },
    });
  });

  it('should append upload config to plugins configs', () => {
    expect(mergeConfigs(MOCK_UPLOAD_CONFIG, MOCK_CONFIG_FULL_ESLINT)).toEqual({
      ...MOCK_UPLOAD_CONFIG,
      ...MOCK_CONFIG_FULL_ESLINT,
    });
  });

  it('should replace API key in upload config', () => {
    expect(
      mergeConfigs(MOCK_UPLOAD_CONFIG, {
        upload: { apiKey: 'my-new-api-key' },
      } as CoreConfig),
    ).toEqual({
      plugins: [],
      upload: { ...MOCK_UPLOAD_CONFIG.upload, apiKey: 'my-new-api-key' },
    });
  });

  it('should merge configs and keep only the last persist config', () => {
    expect(
      mergeConfigs(
        MOCK_CONFIG_NX_VALIDATORS,
        {
          persist: {
            outputDir: '.code-pushup/some-app',
            format: ['md'],
          },
        } as CoreConfig,
        MOCK_CONFIG_PERSIST,
      ),
    ).toEqual({ ...MOCK_CONFIG_PERSIST, ...MOCK_CONFIG_NX_VALIDATORS });
  });

  it('should merge category ref config', () => {
    expect(
      mergeConfigs(MOCK_CONFIG_NX_VALIDATORS, MOCK_CONFIG_BASIC_PLUGIN, {
        plugins: [
          { slug: 'my-plugin' } as PluginConfig,
          { slug: 'basic-plugin' } as PluginConfig,
        ],
        categories: [
          {
            slug: 'nx-validators',
            title: 'Workspace Validation',
            refs: [
              {
                type: 'group',
                plugin: 'my-plugin',
                slug: 'suggestions',
                weight: 1,
              },
            ],
          },
          {
            slug: 'code-style',
            title: 'Code style',
            refs: [
              {
                type: 'group',
                plugin: 'basic-plugin',
                slug: 'formatting',
                weight: 1,
              },
              {
                type: 'group',
                plugin: 'some-other-plugin',
                slug: 'suggestions',
                weight: 1,
              },
            ],
          },
        ],
      }),
    ).toEqual({
      plugins: [
        { slug: 'my-plugin' } as PluginConfig,
        { slug: 'basic-plugin' } as PluginConfig,
      ],
      categories: [
        {
          slug: 'nx-validators',
          title: 'Workspace Validation',
          refs: [
            {
              type: 'group',
              plugin: 'my-plugin',
              slug: 'suggestions',
              weight: 1,
            },
          ],
        },
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          refs: [
            {
              type: 'group',
              plugin: 'basic-plugin',
              slug: 'problems',
              weight: 1,
            },
          ],
        },
        {
          slug: 'code-style',
          title: 'Code style',
          refs: [
            {
              type: 'group',
              plugin: 'basic-plugin',
              slug: 'suggestions',
              weight: 1,
            },
            {
              type: 'group',
              plugin: 'basic-plugin',
              slug: 'formatting',
              weight: 1,
            },
            {
              type: 'group',
              plugin: 'some-other-plugin',
              slug: 'suggestions',
              weight: 1,
            },
          ],
        },
      ],
    });
  });
});

describe('mergeCategoriesBySlug', () => {
  it('should return categories unchanged when no duplicates', () => {
    const categories: CategoryConfig[] = [
      { slug: 'bug-prevention', title: 'Bug prevention', refs: [] },
      { slug: 'code-style', title: 'Code style', refs: [] },
    ];
    expect(mergeCategoriesBySlug(categories)).toEqual(categories);
  });

  it('should merge duplicate slugs — first title wins, refs concatenated', () => {
    expect(
      mergeCategoriesBySlug([
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          refs: [
            { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
          ],
        },
        {
          slug: 'bug-prevention',
          title: 'Bug detection',
          refs: [
            {
              type: 'group',
              plugin: 'basic-plugin',
              slug: 'problems',
              weight: 1,
            },
          ],
        },
      ]),
    ).toEqual([
      {
        slug: 'bug-prevention',
        title: 'Bug prevention',
        refs: [
          { type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 },
          {
            type: 'group',
            plugin: 'basic-plugin',
            slug: 'problems',
            weight: 1,
          },
        ],
      },
    ]);
  });

  it('should join different descriptions as sentences', () => {
    expect(
      mergeCategoriesBySlug([
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          description: 'Catches common bugs',
          refs: [],
        },
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          description: 'Enforces type safety.',
          refs: [],
        },
      ]),
    ).toContainEqual(
      expect.objectContaining({
        description: 'Catches common bugs. Enforces type safety.',
      }),
    );
  });

  it('should not duplicate identical descriptions', () => {
    expect(
      mergeCategoriesBySlug([
        {
          slug: 'code-style',
          title: 'Code style',
          description: 'Consistent formatting.',
          refs: [],
        },
        {
          slug: 'code-style',
          title: 'Code style',
          description: 'Consistent formatting.',
          refs: [],
        },
      ]),
    ).toContainEqual(
      expect.objectContaining({ description: 'Consistent formatting.' }),
    );
  });

  it('should use first non-empty docsUrl', () => {
    expect(
      mergeCategoriesBySlug([
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          docsUrl: 'https://eslint.org/rules',
          refs: [],
        },
        {
          slug: 'bug-prevention',
          title: 'Bug prevention',
          docsUrl: 'https://typescript-eslint.io/rules',
          refs: [],
        },
      ]),
    ).toContainEqual(
      expect.objectContaining({ docsUrl: 'https://eslint.org/rules' }),
    );
  });

  it('should fall back to second value when first is missing', () => {
    expect(
      mergeCategoriesBySlug([
        { slug: 'code-style', title: 'Code style', refs: [] },
        {
          slug: 'code-style',
          title: 'Code style',
          docsUrl: 'https://eslint.org/rules',
          description: 'Consistent formatting.',
          refs: [],
        },
      ]),
    ).toContainEqual(
      expect.objectContaining({
        docsUrl: 'https://eslint.org/rules',
        description: 'Consistent formatting.',
      }),
    );
  });

  it('should return empty array for empty input', () => {
    expect(mergeCategoriesBySlug([])).toEqual([]);
  });
});
