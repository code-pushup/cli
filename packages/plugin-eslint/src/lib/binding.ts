import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type {
  CategoryConfig,
  PluginAnswer,
  PluginSetupBinding,
} from '@code-pushup/models';
import {
  answerArray,
  answerBoolean,
  answerString,
  directoryExists,
  hasDependency,
  readJsonFile,
  singleQuote,
} from '@code-pushup/utils';
import {
  DEFAULT_PATTERN,
  ESLINT_PLUGIN_SLUG,
  ESLINT_PLUGIN_TITLE,
} from './constants.js';

const { name: PACKAGE_NAME } = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

const ESLINT_CONFIG_PATTERN = /^(\.eslintrc(\.\w+)?|eslint\.config\.\w+)$/;

const ESLINT_CATEGORIES: CategoryConfig[] = [
  {
    slug: 'bug-prevention',
    title: 'Bug prevention',
    description: 'Lint rules that find **potential bugs** in your code.',
    refs: [
      {
        type: 'group',
        plugin: ESLINT_PLUGIN_SLUG,
        slug: 'problems',
        weight: 1,
      },
    ],
  },
  {
    slug: 'code-style',
    title: 'Code style',
    description:
      'Lint rules that promote **good practices** and consistency in your code.',
    refs: [
      {
        type: 'group',
        plugin: ESLINT_PLUGIN_SLUG,
        slug: 'suggestions',
        weight: 1,
      },
    ],
  },
];

type EslintOptions = {
  eslintrc: string;
  patterns: string[];
  categories: boolean;
};

export const eslintSetupBinding = {
  slug: ESLINT_PLUGIN_SLUG,
  title: ESLINT_PLUGIN_TITLE,
  packageName: PACKAGE_NAME,
  isRecommended,
  prompts: async (targetDir: string) => [
    {
      key: 'eslint.eslintrc',
      message: 'Path to ESLint config',
      type: 'input',
      default: (await detectEslintConfig(targetDir)) ?? '',
    },
    {
      key: 'eslint.patterns',
      message: 'File patterns to lint',
      type: 'input',
      default: (await directoryExists(path.join(targetDir, 'src')))
        ? 'src'
        : DEFAULT_PATTERN,
    },
    {
      key: 'eslint.categories',
      message: 'Add ESLint categories?',
      type: 'confirm',
      default: true,
    },
  ],
  generateConfig: (answers: Record<string, PluginAnswer>) => {
    const options = parseAnswers(answers);
    return {
      imports: [
        { moduleSpecifier: PACKAGE_NAME, defaultImport: 'eslintPlugin' },
      ],
      pluginInit: formatPluginInit(options),
      ...(options.categories ? { categories: ESLINT_CATEGORIES } : {}),
    };
  },
} satisfies PluginSetupBinding;

function parseAnswers(answers: Record<string, PluginAnswer>): EslintOptions {
  return {
    eslintrc: answerString(answers, 'eslint.eslintrc'),
    patterns: answerArray(answers, 'eslint.patterns'),
    categories: answerBoolean(answers, 'eslint.categories'),
  };
}

function formatPluginInit({ eslintrc, patterns }: EslintOptions): string {
  const useCustomEslintrc =
    eslintrc !== '' && !ESLINT_CONFIG_PATTERN.test(eslintrc);
  const customPatterns = patterns
    .filter(s => s !== '' && s !== DEFAULT_PATTERN)
    .map(singleQuote);

  const body = [
    useCustomEslintrc ? `eslintrc: ${singleQuote(eslintrc)}` : '',
    customPatterns.length === 1 ? `patterns: ${customPatterns[0]}` : '',
    customPatterns.length > 1 ? `patterns: [${customPatterns.join(', ')}]` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return body ? `await eslintPlugin({ ${body} })` : 'await eslintPlugin()';
}

async function isRecommended(targetDir: string): Promise<boolean> {
  if (await detectEslintConfig(targetDir)) {
    return true;
  }
  try {
    const packageJson = await readJsonFile<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(path.join(targetDir, 'package.json'));
    return hasDependency(packageJson, 'eslint');
  } catch {
    return false;
  }
}

async function detectEslintConfig(
  targetDir: string,
): Promise<string | undefined> {
  const files = await readdir(targetDir, { encoding: 'utf8' });
  return files.find(file => ESLINT_CONFIG_PATTERN.test(file));
}
