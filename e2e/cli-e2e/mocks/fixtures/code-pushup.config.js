import eslintPlugin from '@code-pushup/eslint-plugin';

export default {
  upload: {
    organization: 'code-pushup',
    project: 'cli-js',
    apiKey: 'e2e-api-key',
    server: 'https://e2e.com/api',
  },
  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
    },
    {
      slug: 'code-style',
      title: 'Code style',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
      ],
    },
  ],
  plugins: [
    await eslintPlugin({ eslintrc: '.eslintrc.json', patterns: '**/*.ts' }),
  ],
};
