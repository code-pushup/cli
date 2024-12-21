import jsPackagesPlugin from '@code-pushup/js-packages-plugin';
import type { CoreConfig } from '@code-pushup/models';

export default {
  persist: {
    outputDir: './',
    filename: 'report',
    format: ['json'],
  },
  plugins: [await jsPackagesPlugin({ packageManager: 'npm' })],
  categories: [
    {
      slug: 'security',
      title: 'Security',
      refs: [
        { type: 'group', plugin: 'js-packages', slug: 'npm-audit', weight: 1 },
      ],
    },
    {
      slug: 'updates',
      title: 'Updates',
      refs: [
        {
          type: 'group',
          plugin: 'js-packages',
          slug: 'npm-outdated',
          weight: 1,
        },
      ],
    },
  ],
} satisfies CoreConfig;
