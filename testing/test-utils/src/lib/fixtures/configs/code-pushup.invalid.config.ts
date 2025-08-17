import type { CoreConfig } from '@code-pushup/models';

export default {
  persist: { outputDir: 'tmp' },
  upload: {
    organization: 'code-pushup',
    project: 'cli-ts',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      // due to duplicate category references, the config is invalid
      refs: [
        {
          type: 'audit',
          plugin: 'node',
          slug: 'node-version',
          weight: 1,
        },
        {
          type: 'audit',
          plugin: 'node',
          slug: 'node-version',
          weight: 1,
        },
      ],
    },
  ],
  plugins: [
    {
      audits: [
        {
          slug: 'node-version',
          title: 'Node version',
          description: 'prints node version to file',
          docsUrl: 'https://nodejs.org/',
        },
      ],
      runner: {
        command: 'node',
        args: ['-v'],
        outputFile: 'output.json',
      },
      groups: [],
      slug: 'node',
      title: 'Node.js',
      icon: 'javascript',
    },
  ],
} satisfies CoreConfig;
