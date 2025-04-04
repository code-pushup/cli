import type { CoreConfig } from '@code-pushup/models';
import {
  getCategoryRefsFromGroups,
  typescriptPlugin,
} from '@code-pushup/typescript-plugin';

export default {
  plugins: [await typescriptPlugin()],
  categories: [
    {
      slug: 'typescript-quality',
      title: 'Typescript',
      refs: await getCategoryRefsFromGroups(),
    },
  ],
} satisfies CoreConfig;
