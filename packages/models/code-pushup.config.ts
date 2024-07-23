import eslintPlugin from '../../dist/packages/plugin-eslint';
import { eslintConfigFromNxProject } from '../../dist/packages/plugin-eslint';
import jsPackagesPlugin from '../../dist/packages/plugin-js-packages';
import type { CoreConfig } from '../../packages/models/src';

const config: CoreConfig = {
  plugins: [
    await eslintPlugin(await eslintConfigFromNxProject('models')),
    await jsPackagesPlugin({ packageManager: 'npm' }),
  ],
  categories: [
    {
      slug: 'bug-prevention',
      title: 'Bug prevention',
      description: 'Lint rules that find **potential bugs** in your code.',
      refs: [{ type: 'group', plugin: 'eslint', slug: 'problems', weight: 1 }],
    },
    {
      slug: 'code-style',
      title: 'Code style',
      description:
        'Lint rules that promote **good practices** and consistency in your code.',
      refs: [
        { type: 'group', plugin: 'eslint', slug: 'suggestions', weight: 1 },
      ],
    },
    {
      slug: 'security',
      title: 'Security',
      description: 'Finds known **vulnerabilities** in 3rd-party packages.',
      refs: [
        {
          type: 'group',
          plugin: 'js-packages',
          slug: 'npm-audit',
          weight: 1,
        },
      ],
    },
    {
      slug: 'updates',
      title: 'Updates',
      description: 'Finds **outdated** 3rd-party packages.',
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
};

export default config;
