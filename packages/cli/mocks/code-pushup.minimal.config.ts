import {CoreConfig} from '@code-pushup/models';

export default {
  categories: [
    {
      slug: 'category-1',
      title: 'Category 1',
      refs: [
        {
          type: 'audit',
          plugin: 'plugin-1',
          slug: 'audit-1',
          weight: 1,
        },
      ],
    },
  ],
  plugins: [
    {
      slug: 'plugin-1',
      title: 'Plugin Title',
      icon: 'file',
      audits: [
        {
          slug: 'audit-1',
          title: 'Audit Title',
        }
      ],
      runner: {
        command: 'node',
        args: [],
        outputFile: 'plugin-slug-report.json'
      }
    }
  ],
} satisfies CoreConfig;
