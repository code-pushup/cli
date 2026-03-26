import { createRequire } from 'node:module';
import type {
  CategoryCodegenConfig,
  PluginAnswer,
  PluginSetupBinding,
  PluginSetupTree,
} from '@code-pushup/models';
import {
  answerBoolean,
  answerNonEmptyArray,
  answerString,
  singleQuote,
} from '@code-pushup/utils';
import {
  AXE_DEFAULT_PRESET,
  AXE_PLUGIN_SLUG,
  AXE_PLUGIN_TITLE,
  AXE_PRESET_NAMES,
} from './constants.js';

const { name: PACKAGE_NAME } = createRequire(import.meta.url)(
  '../../package.json',
) as typeof import('../../package.json');

const DEFAULT_URL = 'http://localhost:4200';
const PLUGIN_VAR = 'axe';
const SETUP_SCRIPT_PATH = './axe-setup.ts';

const CATEGORIES: CategoryCodegenConfig[] = [
  {
    slug: 'a11y',
    title: 'Accessibility',
    description: 'Tests website **accessibility** in accordance with WCAG',
    refsExpression: `axeGroupRefs(${PLUGIN_VAR})`,
  },
];

const PRESET_CHOICES = Object.entries(AXE_PRESET_NAMES).map(
  ([value, name]) => ({ name, value }),
);

const SETUP_SCRIPT_CONTENT = `import type { Page } from 'playwright-core';

export default async function (page: Page): Promise<void> {
  // ... add your custom logic here ...
}
`;

type AxeOptions = {
  urls: [string, ...string[]];
  preset: string;
  setupScript: boolean;
  categories: boolean;
};

export const axeSetupBinding = {
  slug: AXE_PLUGIN_SLUG,
  title: AXE_PLUGIN_TITLE,
  packageName: PACKAGE_NAME,
  prompts: async () => [
    {
      key: 'axe.urls',
      message: 'Target URL(s) (comma-separated)',
      type: 'input',
      default: DEFAULT_URL,
    },
    {
      key: 'axe.preset',
      message: 'Accessibility preset',
      type: 'select',
      choices: [...PRESET_CHOICES],
      default: AXE_DEFAULT_PRESET,
    },
    {
      key: 'axe.setupScript',
      message: 'Create setup script for auth-protected app?',
      type: 'confirm',
      default: false,
    },
    {
      key: 'axe.categories',
      message: 'Add Axe categories?',
      type: 'confirm',
      default: true,
    },
  ],
  generateConfig: async (
    answers: Record<string, PluginAnswer>,
    tree: PluginSetupTree,
  ) => {
    const options = parseAnswers(answers);
    if (options.setupScript) {
      await tree.write(SETUP_SCRIPT_PATH, SETUP_SCRIPT_CONTENT);
    }
    const hasCategories = options.categories;
    const imports = [
      {
        moduleSpecifier: PACKAGE_NAME,
        defaultImport: 'axePlugin',
        ...(hasCategories ? { namedImports: ['axeGroupRefs'] } : {}),
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
      categories: CATEGORIES,
    };
  },
} satisfies PluginSetupBinding;

function parseAnswers(answers: Record<string, PluginAnswer>): AxeOptions {
  return {
    urls: answerNonEmptyArray(answers, 'axe.urls', DEFAULT_URL),
    preset: answerString(answers, 'axe.preset') || AXE_DEFAULT_PRESET,
    setupScript: answerBoolean(answers, 'axe.setupScript'),
    categories: answerBoolean(answers, 'axe.categories'),
  };
}

function formatPluginCall({ urls, preset, setupScript }: AxeOptions): string {
  const formattedUrls = formatUrls(urls);
  const options = [
    preset !== AXE_DEFAULT_PRESET && `preset: ${singleQuote(preset)}`,
    setupScript && `setupScript: ${singleQuote(SETUP_SCRIPT_PATH)}`,
  ].filter(Boolean);

  if (options.length === 0) {
    return `axePlugin(${formattedUrls})`;
  }
  return `axePlugin(${formattedUrls}, { ${options.join(', ')} })`;
}

function formatUrls([first, ...rest]: [string, ...string[]]): string {
  if (rest.length === 0) {
    return singleQuote(first);
  }
  return `[${[first, ...rest].map(singleQuote).join(', ')}]`;
}
