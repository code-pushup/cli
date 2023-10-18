import { join } from 'path';

const outputDir = 'tmp';
module.exports = {
  upload: {
    organization: 'code-pushup',
    project: 'cli-cjs',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  persist: { outputDir },
  plugins: [
    {
      audits: [
        {
          slug: 'command-object-audit-slug',
          title: 'audit title',
          description: 'audit description',
          docsUrl: 'http://www.my-docs.dev',
        },
      ],
      runner: {
        command: 'echo',
        args: [
          JSON.stringify([
            {
              title: 'dummy-title',
              slug: 'command-object-audit-slug',
              value: 0,
              score: 0,
            },
          ]),
          '>',
          join(outputDir, 'out.json'),
        ],
        outputFile: join(outputDir, 'out.json'),
      },
      groups: [],
      slug: 'command-object-plugin',
      title: 'command-object plugin',
      icon: 'javascript',
    },
  ],
  categories: [],
};
