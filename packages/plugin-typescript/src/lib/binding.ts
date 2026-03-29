import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type {
  CategoryConfig,
  PluginAnswer,
  PluginSetupBinding,
} from '@code-pushup/models';
import {
  answerBoolean,
  answerString,
  fileExists,
  singleQuote,
} from '@code-pushup/utils';
import {
  DEFAULT_TS_CONFIG,
  TSCONFIG_PATTERN,
  TYPESCRIPT_PLUGIN_SLUG,
  TYPESCRIPT_PLUGIN_TITLE,
} from './constants.js';

const { name: PACKAGE_NAME } = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

const TYPESCRIPT_CATEGORIES: CategoryConfig[] = [
  {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    description: 'Type checks that find **potential bugs** in your code.',
    refs: [
      {
        type: 'group',
        plugin: TYPESCRIPT_PLUGIN_SLUG,
        slug: 'problems',
        weight: 1,
      },
    ],
  },
];

type TypescriptOptions = {
  tsconfig: string;
  categories: boolean;
};

export const typescriptSetupBinding = {
  slug: TYPESCRIPT_PLUGIN_SLUG,
  title: TYPESCRIPT_PLUGIN_TITLE,
  packageName: PACKAGE_NAME,
  isRecommended,
  prompts: async (targetDir: string) => {
    const tsconfig = await detectTsconfig(targetDir);
    return [
      {
        key: 'typescript.tsconfig',
        message: 'TypeScript config file',
        type: 'input',
        default: tsconfig,
      },
      {
        key: 'typescript.categories',
        message: 'Add TypeScript categories?',
        type: 'confirm',
        default: true,
      },
    ];
  },
  generateConfig: (answers: Record<string, PluginAnswer>) => {
    const options = parseAnswers(answers);
    return {
      imports: [
        { moduleSpecifier: PACKAGE_NAME, defaultImport: 'typescriptPlugin' },
      ],
      pluginInit: formatPluginInit(options),
      ...(options.categories ? { categories: TYPESCRIPT_CATEGORIES } : {}),
    };
  },
} satisfies PluginSetupBinding;

function parseAnswers(
  answers: Record<string, PluginAnswer>,
): TypescriptOptions {
  return {
    tsconfig: answerString(answers, 'typescript.tsconfig') || DEFAULT_TS_CONFIG,
    categories: answerBoolean(answers, 'typescript.categories'),
  };
}

function formatPluginInit({ tsconfig }: TypescriptOptions): string[] {
  return tsconfig === DEFAULT_TS_CONFIG
    ? ['typescriptPlugin(),']
    : ['typescriptPlugin({', `  tsconfig: ${singleQuote(tsconfig)},`, '}),'];
}

async function isRecommended(targetDir: string): Promise<boolean> {
  return (
    (await fileExists(path.join(targetDir, 'tsconfig.json'))) ||
    (await fileExists(path.join(targetDir, 'tsconfig.base.json')))
  );
}

async function detectTsconfig(targetDir: string): Promise<string> {
  const files = await readdir(targetDir, { encoding: 'utf8' });
  const match = files.find(file => TSCONFIG_PATTERN.test(file));
  return match ?? DEFAULT_TS_CONFIG;
}
