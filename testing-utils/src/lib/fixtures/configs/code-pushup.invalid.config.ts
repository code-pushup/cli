import { join } from 'node:path';
import { type RcConfig } from '@code-pushup/models';

export default {
  persist: { outputDir: join('tmp', 'ts'), filename: 'report' },
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
} satisfies RcConfig;
