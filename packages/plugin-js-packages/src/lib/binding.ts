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
  fileExists,
  singleQuote,
} from '@code-pushup/utils';
import {
  DEFAULT_CHECKS,
  DEFAULT_DEPENDENCY_GROUPS,
  JS_PACKAGES_PLUGIN_SLUG,
  JS_PACKAGES_PLUGIN_TITLE,
} from './constants.js';
import { detectPackageManager } from './package-managers/derive-package-manager.js';

const { name: PACKAGE_NAME } = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

const DEFAULT_PACKAGE_MANAGER = 'npm';

const PACKAGE_MANAGERS = [
  { name: 'npm', value: DEFAULT_PACKAGE_MANAGER },
  { name: 'yarn (classic)', value: 'yarn-classic' },
  { name: 'yarn (modern)', value: 'yarn-modern' },
  { name: 'pnpm', value: 'pnpm' },
] as const;

const CHECKS = [
  { name: 'audit (security vulnerabilities)', value: 'audit' },
  { name: 'outdated (outdated dependencies)', value: 'outdated' },
] as const;

const DEPENDENCY_GROUPS = [
  { name: 'production', value: 'prod' },
  { name: 'development', value: 'dev' },
  { name: 'optional', value: 'optional' },
] as const;

const CATEGORIES = [
  {
    check: 'audit',
    slug: 'security',
    title: 'Security',
    description: 'Finds known **vulnerabilities** in third-party packages.',
  },
  {
    check: 'outdated',
    slug: 'updates',
    title: 'Updates',
    description: 'Finds **outdated** third-party packages.',
  },
];

type JsPackagesOptions = {
  packageManager: string;
  checks: string[];
  dependencyGroups: string[];
  categories: boolean;
};

export const jsPackagesSetupBinding = {
  slug: JS_PACKAGES_PLUGIN_SLUG,
  title: JS_PACKAGES_PLUGIN_TITLE,
  packageName: PACKAGE_NAME,
  isRecommended,
  prompts: async (targetDir: string) => {
    const packageManager = await detectPackageManager(targetDir).catch(
      () => DEFAULT_PACKAGE_MANAGER,
    );
    return [
      {
        key: 'js-packages.packageManager',
        message: 'Package manager',
        type: 'select',
        choices: [...PACKAGE_MANAGERS],
        default: packageManager,
      },
      {
        key: 'js-packages.checks',
        message: 'Checks to run',
        type: 'checkbox',
        choices: [...CHECKS],
        default: [...DEFAULT_CHECKS],
      },
      {
        key: 'js-packages.dependencyGroups',
        message: 'Dependency groups',
        type: 'checkbox',
        choices: [...DEPENDENCY_GROUPS],
        default: [...DEFAULT_DEPENDENCY_GROUPS],
      },
      {
        key: 'js-packages.categories',
        message: 'Add JS packages categories?',
        type: 'confirm',
        default: true,
      },
    ];
  },
  generateConfig: (answers: Record<string, PluginAnswer>) => {
    const options = parseAnswers(answers);
    return {
      imports: [
        { moduleSpecifier: PACKAGE_NAME, defaultImport: 'jsPackagesPlugin' },
      ],
      pluginInit: formatPluginInit(options),
      ...(options.categories ? { categories: createCategories(options) } : {}),
    };
  },
} satisfies PluginSetupBinding;

function parseAnswers(
  answers: Record<string, PluginAnswer>,
): JsPackagesOptions {
  return {
    packageManager:
      answerString(answers, 'js-packages.packageManager') ||
      DEFAULT_PACKAGE_MANAGER,
    checks: answerArray(answers, 'js-packages.checks'),
    dependencyGroups: answerArray(answers, 'js-packages.dependencyGroups'),
    categories: answerBoolean(answers, 'js-packages.categories'),
  };
}

function formatPluginInit(options: JsPackagesOptions): string[] {
  const { packageManager, checks, dependencyGroups } = options;

  const hasNonDefaultChecks =
    checks.length > 0 && checks.length < DEFAULT_CHECKS.length;
  const hasNonDefaultDepGroups =
    dependencyGroups.length !== DEFAULT_DEPENDENCY_GROUPS.length ||
    !DEFAULT_DEPENDENCY_GROUPS.every(g => dependencyGroups.includes(g));

  const body = [
    `packageManager: ${singleQuote(packageManager)},`,
    hasNonDefaultChecks
      ? `checks: [${checks.map(singleQuote).join(', ')}],`
      : '',
    hasNonDefaultDepGroups
      ? `dependencyGroups: [${dependencyGroups.map(singleQuote).join(', ')}],`
      : '',
  ].filter(Boolean);

  return ['await jsPackagesPlugin({', ...body.map(line => `  ${line}`), '}),'];
}

function createCategories({
  packageManager,
  checks,
}: JsPackagesOptions): CategoryConfig[] {
  return CATEGORIES.filter(({ check }) => checks.includes(check)).map(
    ({ check, slug, title, description }) => ({
      slug,
      title,
      description,
      refs: [
        {
          type: 'group',
          plugin: JS_PACKAGES_PLUGIN_SLUG,
          slug: `${packageManager}-${check}`,
          weight: 1,
        },
      ],
    }),
  );
}

async function isRecommended(targetDir: string): Promise<boolean> {
  return fileExists(path.join(targetDir, 'package.json'));
}
