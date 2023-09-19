const { runnerOutputSchema } = require('@quality-metrics/models');
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
        command: 'bash',
        args: [
          '-c',
          `echo '${JSON.stringify(
            runnerOutputSchema.parse([
              {
                slug: 'command-object-audit-slug',
                value: 0,
                score: 0,
              },
            ]),
          )}' > command-object-config-out.json`,
        ],
        outputPath: 'command-object-config-out.json',
      },
      groups: [],
      meta: {
        slug: 'command-object-plugin',
        name: 'command-object plugin',
      },
    },
  ],
  categories: [],
};
