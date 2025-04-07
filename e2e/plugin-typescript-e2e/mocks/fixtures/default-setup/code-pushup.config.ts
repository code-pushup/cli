import type { CoreConfig } from '@code-pushup/models';
import typescriptPlugin, {
  getCategoryRefsFromGroups,
} from '@code-pushup/typescript-plugin';

export default {
  plugins: [await typescriptPlugin()],
  categories: [
    {
      slug: 'type-safety',
      title: 'Type safety',
      refs: getCategoryRefsFromGroups(),
    },
  ],
} satisfies CoreConfig;
