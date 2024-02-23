export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli-js',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [
    {
      slug: 'category-1',
      title: 'Category 1',
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
};
