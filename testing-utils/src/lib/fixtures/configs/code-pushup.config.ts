import { type RcConfig } from '@code-pushup/models';

export default {
  // @TODO remove ad we have defaults
  persist: { filename: 'output.json' },
  upload: {
    organization: 'code-pushup',
    project: 'cli-ts',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [],
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
} satisfies RcConfig;
