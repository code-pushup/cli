import { readdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type {
  CategoryConfig,
  PluginAnswer,
  PluginSetupBinding,
  PluginSetupTree,
} from '@code-pushup/models';
import {
  answerArray,
  answerBoolean,
  answerString,
  hasDependency,
  pluralize,
  readJsonFile,
  singleQuote,
} from '@code-pushup/utils';
import { addLcovReporter, hasLcovReporter } from './config-file.js';
import {
  ALL_COVERAGE_TYPES,
  COVERAGE_PLUGIN_SLUG,
  COVERAGE_PLUGIN_TITLE,
} from './constants.js';

const { name: PACKAGE_NAME } = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

const CONFIG_EXT = '[mc]?[tj]s';
const VITEST_CONFIG = new RegExp(`^vi(test|te)\\.config\\.${CONFIG_EXT}$`);
const VITEST_WORKSPACE = new RegExp(`^vitest\\.workspace\\.${CONFIG_EXT}$`);
const JEST_CONFIG = new RegExp(`^jest\\.config\\.${CONFIG_EXT}$`);
const DEFAULT_REPORT_PATH = 'coverage/lcov.info';

const LCOV_COMMENT =
  '// NOTE: Ensure your test config includes "lcov" in coverage reporters.';

const FRAMEWORKS = [
  { name: 'Jest', value: 'jest' },
  { name: 'Vitest', value: 'vitest' },
  { name: 'other', value: 'other' },
] as const;
type Framework = (typeof FRAMEWORKS)[number]['value'];

const CATEGORIES: CategoryConfig[] = [
  {
    slug: 'code-coverage',
    title: 'Code coverage',
    description: 'Measures how much of your code is **covered by tests**.',
    refs: [
      {
        type: 'group',
        plugin: COVERAGE_PLUGIN_SLUG,
        slug: 'coverage',
        weight: 1,
      },
    ],
  },
];

type CoverageOptions = {
  framework: string;
  configFile: string;
  reportPath: string;
  testCommand: string;
  types: string[];
  continueOnFail: boolean;
  categories: boolean;
};

export const coverageSetupBinding = {
  slug: COVERAGE_PLUGIN_SLUG,
  title: COVERAGE_PLUGIN_TITLE,
  packageName: PACKAGE_NAME,
  isRecommended,
  // eslint-disable-next-line max-lines-per-function
  prompts: async (targetDir: string) => {
    const framework = await detectFramework(targetDir);
    const configFile = await detectConfigFile(targetDir, framework);
    return [
      {
        key: 'coverage.framework',
        message: 'Test framework:',
        type: 'select',
        choices: [...FRAMEWORKS],
        default: framework,
      },
      {
        key: 'coverage.configFile',
        message: 'Path to test config file:',
        type: 'input',
        default: configFile ?? '',
      },
      {
        key: 'coverage.reportPath',
        message: 'Path to LCOV report file:',
        type: 'input',
        default: framework === 'other' ? '' : DEFAULT_REPORT_PATH,
      },
      {
        key: 'coverage.testCommand',
        message: 'Command to run tests with coverage:',
        type: 'input',
        default: defaultTestCommand(framework),
      },
      {
        key: 'coverage.types',
        message: 'Coverage types:',
        type: 'checkbox',
        choices: ALL_COVERAGE_TYPES.map(type => ({
          name: pluralize(type),
          value: type,
        })),
        default: [...ALL_COVERAGE_TYPES],
      },
      {
        key: 'coverage.continueOnFail',
        message: 'Continue if test command fails?',
        type: 'confirm',
        default: true,
      },
      {
        key: 'coverage.categories',
        message: 'Add categories?',
        type: 'confirm',
        default: true,
      },
    ];
  },
  generateConfig: async (
    answers: Record<string, PluginAnswer>,
    tree?: PluginSetupTree,
  ) => {
    const options = parseAnswers(answers);
    const lcovConfigured = await configureLcovReporter(options, tree);
    return {
      imports: [
        { moduleSpecifier: PACKAGE_NAME, defaultImport: 'coveragePlugin' },
      ],
      pluginInit: formatPluginInit(options, lcovConfigured),
      ...(options.categories ? { categories: CATEGORIES } : {}),
    };
  },
} satisfies PluginSetupBinding;

function parseAnswers(answers: Record<string, PluginAnswer>): CoverageOptions {
  return {
    framework: answerString(answers, 'coverage.framework'),
    configFile: answerString(answers, 'coverage.configFile'),
    reportPath:
      answerString(answers, 'coverage.reportPath') || DEFAULT_REPORT_PATH,
    testCommand: answerString(answers, 'coverage.testCommand'),
    types: answerArray(answers, 'coverage.types'),
    continueOnFail: answerBoolean(answers, 'coverage.continueOnFail'),
    categories: answerBoolean(answers, 'coverage.categories'),
  };
}

/** Returns true if lcov reporter is already present or was successfully added. */
async function configureLcovReporter(
  options: CoverageOptions,
  tree?: PluginSetupTree,
): Promise<boolean> {
  const { framework, configFile } = options;
  if (framework === 'other' || !configFile || !tree) {
    return false;
  }
  const content = await tree.read(configFile);
  if (content == null) {
    return false;
  }
  if (hasLcovReporter(content, framework)) {
    return true;
  }
  const modified = addLcovReporter(content, framework);
  if (modified === content) {
    return false;
  }
  await tree.write(configFile, modified);
  return true;
}

function formatPluginInit(
  options: CoverageOptions,
  lcovConfigured: boolean,
): string[] {
  const { reportPath, testCommand, types, continueOnFail } = options;

  const hasCustomTypes =
    types.length > 0 && types.length < ALL_COVERAGE_TYPES.length;

  const body = [
    `reports: [${singleQuote(reportPath)}],`,
    testCommand
      ? `coverageToolCommand: { command: ${singleQuote(testCommand)} },`
      : '',
    hasCustomTypes
      ? `coverageTypes: [${types.map(singleQuote).join(', ')}],`
      : '',
    continueOnFail ? '' : 'continueOnCommandFail: false,',
  ].filter(Boolean);

  const init = [
    'await coveragePlugin({',
    ...body.map(line => `  ${line}`),
    '}),',
  ];
  return lcovConfigured ? init : [LCOV_COMMENT, ...init];
}

async function isRecommended(targetDir: string): Promise<boolean> {
  return (await detectFramework(targetDir)) !== 'other';
}

async function detectFramework(targetDir: string): Promise<Framework> {
  const files = await readdir(targetDir, { encoding: 'utf8' });
  const hasVitestConfig = files.some(
    file => VITEST_CONFIG.test(file) || VITEST_WORKSPACE.test(file),
  );
  const hasJestConfig = files.some(file => JEST_CONFIG.test(file));
  if (hasVitestConfig) {
    return 'vitest';
  }
  if (hasJestConfig) {
    return 'jest';
  }
  try {
    const packageJson = await readJsonFile<{
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }>(path.join(targetDir, 'package.json'));
    if (hasDependency(packageJson, 'vitest')) {
      return 'vitest';
    }
    if (hasDependency(packageJson, 'jest')) {
      return 'jest';
    }
  } catch {
    return 'other';
  }
  return 'other';
}

async function detectConfigFile(
  targetDir: string,
  framework: Framework,
): Promise<string | undefined> {
  if (framework === 'other') {
    return undefined;
  }
  const files = await readdir(targetDir, { encoding: 'utf8' });
  const pattern = framework === 'vitest' ? VITEST_CONFIG : JEST_CONFIG;
  return files.find(file => pattern.test(file));
}

function defaultTestCommand(framework: Framework): string {
  switch (framework) {
    case 'jest':
      return 'npx jest --coverage';
    case 'vitest':
      return 'npx vitest run --coverage.enabled';
    default:
      return '';
  }
}
