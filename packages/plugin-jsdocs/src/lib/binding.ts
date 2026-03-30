import { createRequire } from 'node:module';
import type {
  CategoryConfig,
  PluginAnswer,
  PluginSetupBinding,
} from '@code-pushup/models';
import {
  answerBoolean,
  answerNonEmptyArray,
  singleQuote,
} from '@code-pushup/utils';
import { PLUGIN_SLUG, PLUGIN_TITLE } from './constants.js';

const { name: PACKAGE_NAME } = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

const DEFAULT_PATTERNS: [string, ...string[]] = [
  'src/**/*.ts',
  'src/**/*.js',
  '!**/node_modules',
];

const CATEGORIES: CategoryConfig[] = [
  {
    slug: 'docs',
    title: 'Documentation',
    description: 'Measures how much of your code is **documented**.',
    refs: [
      {
        type: 'group',
        plugin: PLUGIN_SLUG,
        slug: 'documentation-coverage',
        weight: 1,
      },
    ],
  },
];

type JsDocsOptions = {
  patterns: [string, ...string[]];
  categories: boolean;
};

export const jsDocsSetupBinding = {
  slug: PLUGIN_SLUG,
  title: PLUGIN_TITLE,
  packageName: PACKAGE_NAME,
  prompts: async () => [
    {
      key: 'jsdocs.patterns',
      message: 'Source file patterns (comma-separated):',
      type: 'input',
      default: DEFAULT_PATTERNS.join(', '),
    },
    {
      key: 'jsdocs.categories',
      message: 'Add categories?',
      type: 'confirm',
      default: true,
    },
  ],
  generateConfig: (answers: Record<string, PluginAnswer>) => {
    const options = parseAnswers(answers);
    return {
      imports: [
        { moduleSpecifier: PACKAGE_NAME, defaultImport: 'jsDocsPlugin' },
      ],
      pluginInit: formatPluginInit(options.patterns),
      ...(options.categories ? { categories: CATEGORIES } : {}),
    };
  },
} satisfies PluginSetupBinding;

function parseAnswers(answers: Record<string, PluginAnswer>): JsDocsOptions {
  return {
    patterns: answerNonEmptyArray(
      answers,
      'jsdocs.patterns',
      DEFAULT_PATTERNS[0],
    ),
    categories: answerBoolean(answers, 'jsdocs.categories'),
  };
}

function formatPluginInit([first, ...rest]: [string, ...string[]]): string[] {
  if (rest.length === 0) {
    return [`jsDocsPlugin(${singleQuote(first)}),`];
  }
  return [
    'jsDocsPlugin([',
    ...[first, ...rest].map(p => `  ${singleQuote(p)},`),
    ']),',
  ];
}
