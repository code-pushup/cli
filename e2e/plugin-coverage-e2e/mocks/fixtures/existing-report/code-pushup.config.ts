import path from 'node:path';
import coveragePlugin from '@code-pushup/coverage-plugin';
import type { CoreConfig } from '@code-pushup/models';

export default {
  plugins: [
    await coveragePlugin({
      reports: [path.join('coverage', 'lcov.info')],
    }),
  ],
  categories: [
    {
      slug: 'code-coverage',
      title: 'Code coverage',
      refs: [
        {
          type: 'group',
          plugin: 'coverage',
          slug: 'coverage',
          weight: 1,
        },
      ],
    },
  ],
} satisfies CoreConfig;
