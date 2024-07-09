import { describe, expect, it } from 'vitest';
import { CoreConfig, PluginConfig } from '@code-pushup/models';
import { mergeConfigs } from './merge-configs';

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

  it('should merge add upload to config', () => {
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

  it('should change a description of plugin audit config', () => {
    expect(
      mergeConfigs(MOCK_CONFIG_FULL_ESLINT, {
        plugins: [
          {
            slug: 'eslint',
            audits: [
              {
                slug: 'no-const-assign',
                description: 'Do not touch the constants',
              },
            ],
          },
        ],
      } as CoreConfig),
    ).toEqual({
      plugins: [
        {
          ...MOCK_JUST_ESLINT_PLUGIN,
          audits: [
            {
              ...MOCK_JUST_ESLINT_PLUGIN.audits[0],
              description: 'Do not touch the constants',
            },
            MOCK_JUST_ESLINT_PLUGIN.audits[1],
          ],
        },
      ],
    });
  });

  it('should change a weight of plugin groups config', () => {
    expect(
      mergeConfigs(
        MOCK_CONFIG_FULL_ESLINT,
        {
          plugins: [
            {
              slug: 'eslint',
              groups: [
                {
                  slug: 'problems',
                  refs: [{ slug: 'no-const-assign', weight: 2 }],
                },
              ],
            },
          ],
        } as CoreConfig,
        MOCK_CONFIG_PERSIST,
      ),
    ).toEqual({
      ...MOCK_CONFIG_PERSIST,
      plugins: [
        {
          ...MOCK_JUST_ESLINT_PLUGIN,
          groups: [
            {
              ...MOCK_JUST_ESLINT_PLUGIN.groups[0],
              refs: [
                {
                  ...MOCK_JUST_ESLINT_PLUGIN.groups[0].refs[0],
                  weight: 2,
                },
                MOCK_JUST_ESLINT_PLUGIN.groups[0].refs[1],
              ],
            },
          ],
        },
      ],
    });
  });

  it('should merge same plugin configurations', () => {
    expect(
      mergeConfigs(MOCK_CONFIG_FULL_ESLINT, {
        plugins: [
          {
            slug: 'eslint',
            description: 'Mock Code PushUp ESLint plugin',
            packageName: '@code-pushup/mock-eslint-plugin',
            version: '1.0.0',
          },
        ],
      } as CoreConfig),
    ).toEqual({
      plugins: [
        {
          ...MOCK_JUST_ESLINT_PLUGIN,
          description: 'Mock Code PushUp ESLint plugin',
          packageName: '@code-pushup/mock-eslint-plugin',
          version: '1.0.0',
        },
      ],
    });
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
          ],
        },
      ],
    });
  });
});
