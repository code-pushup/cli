module.exports = {
  persist: { outputPath: 'command-object-config-out.json' },
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
          `require('fs').writeFileSync('tmp/command-object-config-out.json', '${JSON.stringify(
            [
              {
                slug: 'command-object-audit-slug',
                value: 0,
                score: 0,
              },
            ],
          )}')`,
        ],
        outputPath: 'tmp/command-object-config-out.json',
      },
      groups: [],
      slug: 'command-object-plugin',
      title: 'command-object plugin',
    },
  ],
  categories: [],
};
