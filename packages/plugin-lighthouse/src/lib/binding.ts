import { createRequire } from 'node:module';
import type {
  CategoryCodegenConfig,
  PluginAnswer,
  PluginSetupBinding,
} from '@code-pushup/models';
import {
  answerArray,
  answerNonEmptyArray,
  singleQuote,
} from '@code-pushup/utils';
import {
  LIGHTHOUSE_GROUP_SLUGS,
  LIGHTHOUSE_PLUGIN_SLUG,
  LIGHTHOUSE_PLUGIN_TITLE,
} from './constants.js';
import type { LighthouseGroupSlug } from './types.js';

const { name: PACKAGE_NAME } = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

const DEFAULT_URL = 'http://localhost:4200';
const PLUGIN_VAR = 'lhPlugin';

const CATEGORY_TO_GROUP: Record<string, LighthouseGroupSlug> = {
  performance: 'performance',
  a11y: 'accessibility',
  'best-practices': 'best-practices',
  seo: 'seo',
};

const CATEGORIES: CategoryCodegenConfig[] = [
  {
    slug: 'performance',
    title: 'Performance',
    description:
      'Measure performance and find opportunities to speed up page loads.',
    refsExpression: `lighthouseGroupRefs(${PLUGIN_VAR}, 'performance')`,
  },
  {
    slug: 'a11y',
    title: 'Accessibility',
    description:
      'Determine if all users access content and navigate your site effectively.',
    refsExpression: `lighthouseGroupRefs(${PLUGIN_VAR}, 'accessibility')`,
  },
  {
    slug: 'best-practices',
    title: 'Best Practices',
    description:
      'Improve code health of your web page following these best practices.',
    refsExpression: `lighthouseGroupRefs(${PLUGIN_VAR}, 'best-practices')`,
  },
  {
    slug: 'seo',
    title: 'SEO',
    description:
      'Ensure that your page is optimized for search engine results ranking.',
    refsExpression: `lighthouseGroupRefs(${PLUGIN_VAR}, 'seo')`,
  },
];

const CATEGORY_CHOICES = CATEGORIES.map(({ slug, title }) => ({
  name: title,
  value: slug,
}));

const DEFAULT_CATEGORIES = CATEGORIES.map(({ slug }) => slug);

type LighthouseOptions = {
  urls: [string, ...string[]];
  categories: string[];
};

export const lighthouseSetupBinding = {
  slug: LIGHTHOUSE_PLUGIN_SLUG,
  title: LIGHTHOUSE_PLUGIN_TITLE,
  packageName: PACKAGE_NAME,
  prompts: async (_targetDir: string) => [
    {
      key: 'lighthouse.urls',
      message: 'Target URL(s) (comma-separated)',
      type: 'input',
      default: DEFAULT_URL,
    },
    {
      key: 'lighthouse.categories',
      message: 'Lighthouse categories',
      type: 'checkbox',
      choices: [...CATEGORY_CHOICES],
      default: [...DEFAULT_CATEGORIES],
    },
  ],
  generateConfig: (answers: Record<string, PluginAnswer>) => {
    const options = parseAnswers(answers);
    const hasCategories = options.categories.length > 0;
    const imports = [
      {
        moduleSpecifier: PACKAGE_NAME,
        defaultImport: 'lighthousePlugin',
        ...(hasCategories ? { namedImports: ['lighthouseGroupRefs'] } : {}),
      },
    ];
    const pluginCall = formatPluginCall(options);

    if (!hasCategories) {
      return {
        imports,
        pluginInit: [`${pluginCall},`],
      };
    }
    return {
      imports,
      pluginDeclaration: {
        identifier: PLUGIN_VAR,
        expression: pluginCall,
      },
      pluginInit: [`${PLUGIN_VAR},`],
      categories: createCategories(options),
    };
  },
} satisfies PluginSetupBinding;

function parseAnswers(
  answers: Record<string, PluginAnswer>,
): LighthouseOptions {
  return {
    urls: answerNonEmptyArray(answers, 'lighthouse.urls', DEFAULT_URL),
    categories: answerArray(answers, 'lighthouse.categories'),
  };
}

function formatPluginCall({ urls, categories }: LighthouseOptions): string {
  const formattedUrls = formatUrls(urls);
  const groups = categories.flatMap(slug => {
    const group = CATEGORY_TO_GROUP[slug];
    return group ? [group] : [];
  });
  if (groups.length === 0 || groups.length === LIGHTHOUSE_GROUP_SLUGS.length) {
    return `lighthousePlugin(${formattedUrls})`;
  }
  const onlyGroups = groups.map(singleQuote).join(', ');
  return `lighthousePlugin(${formattedUrls}, { onlyGroups: [${onlyGroups}] })`;
}

function formatUrls([first, ...rest]: [string, ...string[]]): string {
  if (rest.length === 0) {
    return singleQuote(first);
  }
  return `[${[first, ...rest].map(singleQuote).join(', ')}]`;
}

function createCategories({
  categories,
}: LighthouseOptions): CategoryCodegenConfig[] {
  return CATEGORIES.filter(({ slug }) => categories.includes(slug));
}
