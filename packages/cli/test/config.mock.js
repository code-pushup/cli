const outputPath = 'tmp';
export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli-js',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  persist: { outputPath },
  plugins: [
    {
      audits: [
        {
          slug: 'command-object-audit-slug',
          title: 'audit title',
          description: 'audit description',
          label: 'mock audit label',
          docsUrl: 'http://www.my-docs.dev',
        },
      ],
      runner: {
        command: 'node',
        args: [
          '-e',
          `require('fs').writeFileSync('${outputPath}/out.json', '${JSON.stringify(
            [
              {
                title: 'dummy-title',
                slug: 'command-object-audit-slug',
                value: 0,
                score: 0,
              },
            ],
          )}')`,
        ],
        outputPath: `${outputPath}/out.json`,
      },
      groups: [],
      slug: 'command-object-plugin',
      title: 'command-object plugin',
      icon: 'javascript',
    },
  ],
  categories: [],
};
