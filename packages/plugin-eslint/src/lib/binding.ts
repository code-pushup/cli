import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type {
  CategoryConfig,
  PluginAnswer,
  PluginSetupBinding,
} from '@code-pushup/models';
import {
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
      message: 'Add recommended categories (bug prevention, code style)?',
      type: 'confirm',
      default: true,
    },
  ],
  generateConfig: (answers: Record<string, PluginAnswer>) => {
    const withCategories = answers['eslint.categories'] !== false;
    const args = [
      resolveEslintrc(answers['eslint.eslintrc']),
      resolvePatterns(answers['eslint.patterns']),
    ].filter(Boolean);

    return {
      imports: [
        { moduleSpecifier: PACKAGE_NAME, defaultImport: 'eslintPlugin' },
      ],
      pluginInit:
        args.length > 0
          ? `await eslintPlugin({ ${args.join(', ')} })`
          : 'await eslintPlugin()',
      ...(withCategories ? { categories: ESLINT_CATEGORIES } : {}),
    };
  },
} satisfies PluginSetupBinding;

async function detectEslintConfig(
  targetDir: string,
): Promise<string | undefined> {
  const files = await readdir(targetDir, { encoding: 'utf8' });
  return files.find(file => ESLINT_CONFIG_PATTERN.test(file));
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

/** Omits `eslintrc` for standard config filenames (ESLint discovers them automatically). */
function resolveEslintrc(value: PluginAnswer | undefined): string {
  if (typeof value !== 'string' || !value) {
    return '';
  }
  if (ESLINT_CONFIG_PATTERN.test(value)) {
    return '';
  }
  return `eslintrc: ${singleQuote(value)}`;
}

/** Formats patterns as a string or array literal, omitting the plugin default. */
function resolvePatterns(value: PluginAnswer | undefined): string {
  if (typeof value === 'string') {
    return resolvePatterns(value.split(','));
  }
  if (!Array.isArray(value)) {
    return '';
  }
  const patterns = value
    .map(s => s.trim())
    .filter(s => s !== '' && s !== DEFAULT_PATTERN)
    .map(singleQuote);
  if (patterns.length === 0) {
    return '';
  }
  if (patterns.length === 1) {
    return `patterns: ${patterns.join('')}`;
  }
  return `patterns: [${patterns.join(', ')}]`;
}
