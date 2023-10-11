const outputPath = 'tmp';

export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli',
    apiKey: 'dummy-api-key',
    server: 'https://example.com/api',
  },
  persist: { outputPath },
  plugins: [
    {
      slug: 'dummy-plugin',
      title: 'Dummy Plugin',
      icon: 'javascript',
      docsUrl: 'http://www.my-docs.dev?slug=dummy-plugin',
      audits: [
        {
          slug: 'dummy-audit-1',
          title: 'Dummy Audit 1',
          description: 'A dummy audit to fill the void 1',
          label: '???',
          docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-1',
        },
        {
          slug: 'dummy-audit-2',
          title: 'Dummy Audit 2',
          description: 'A dummy audit to fill the void 2',
          label: '???',
          docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-2',
        },
        {
          slug: 'dummy-audit-3',
          title: 'Dummy Audit 3',
          description: 'A dummy audit to fill the void 3',
          label: '???',
          docsUrl: 'http://www.my-docs.dev?slug=dummy-audit-3',
        },
      ],
      runner: {
        command: 'node',
        args: [
          '-e',
          `require('fs').writeFileSync('${outputPath}/dummy-plugin-output.json', '${JSON.stringify(
            [
              {
                title: 'Dummy Audit 1',
                slug: 'dummy-audit-1',
                value: 420,
                score: 0.42,
              },
              {
                title: 'Dummy Audit 2',
                slug: 'dummy-audit-2',
                value: 80,
                score: 0,
              },
              {
                title: 'Dummy Audit 3',
                slug: 'dummy-audit-3',
                value: 12,
                score: 0.12,
              },
            ],
          )}')`,
        ],
        outputPath: `${outputPath}/dummy-plugin-output.json`,
      },
    },
  ],
  categories: [
    {
      slug: 'dummy-category-1',
      title: 'Dummy Category 1',
      description: 'A dummy audit to fill the void',
      refs: [
        {
          plugin: 'dummy-plugin',
          type: 'audit',
          slug: 'dummy-audit-1',
          weight: 1,
        },
        {
          plugin: 'dummy-plugin',
          type: 'audit',
          slug: 'dummy-audit-2',
          weight: 6,
        },
      ],
    },
    {
      slug: 'dummy-category-2',
      title: 'Dummy Category 2',
      description: 'A dummy audit to fill the void 2',
      refs: [
        {
          plugin: 'dummy-plugin',
          type: 'audit',
          slug: 'dummy-audit-3',
          weight: 3,
        },
      ],
    },
  ],
};
