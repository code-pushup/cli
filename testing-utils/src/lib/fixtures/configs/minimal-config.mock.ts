import type {
  CoreConfig,
  Issue,
  PluginConfig,
} from '../../../../../packages/models/src';

export const MINIMAL_PLUGIN_CONFIG_MOCK: PluginConfig = {
  slug: 'node',
  title: 'Node',
  icon: 'javascript',
  audits: [
    {
      slug: 'node-version',
      title: 'Node version',
      description: 'Returns node version',
      docsUrl: 'https://nodejs.org/',
    },
  ],
  runner: () => [
    {
      slug: 'node-version',
      title: 'Node version',
      description: 'Returns node version',
      docsUrl: 'https://nodejs.org/',
      score: 0.3,
      value: 16,
      displayValue: '16.0.0',
      details: {
        issues: [
          {
            severity: 'error',
            message: 'The required Node version to run Code PushUp CLI is 18.',
          } satisfies Issue,
        ],
      },
    },
  ],
};

export const MINIMAL_CONFIG_MOCK: CoreConfig = {
  persist: { outputDir: 'test', filename: 'report.json' },
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  categories: [
    {
      slug: 'info',
      title: 'Information',
      refs: [
        {
          type: 'audit',
          plugin: 'node',
          slug: 'node-version',
          weight: 1,
        },
      ],
    },
  ],
  plugins: [MINIMAL_PLUGIN_CONFIG_MOCK],
};
