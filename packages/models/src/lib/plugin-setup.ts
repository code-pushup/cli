import type { CategoryConfig } from './category-config.js';
import type { PluginMeta } from './plugin-config.js';

type PromptBase = {
  key: string;
  message: string;
};

type PromptChoice<T extends string> = { name: string; value: T };

type InputPrompt = PromptBase & {
  type: 'input';
  default: string;
};

type SelectPrompt<T extends string = string> = PromptBase & {
  type: 'select';
  choices: PromptChoice<T>[];
  default: T;
};

type CheckboxPrompt<T extends string = string> = PromptBase & {
  type: 'checkbox';
  choices: PromptChoice<T>[];
  default: T[];
};

/** Declarative prompt definition used to collect plugin-specific options. */
export type PluginPromptDescriptor =
  | InputPrompt
  | SelectPrompt
  | CheckboxPrompt;

export type ImportDeclarationStructure = {
  moduleSpecifier: string;
  defaultImport?: string;
  namedImports?: string[];
  isTypeOnly?: boolean;
};

/** Import declarations and plugin initialization code produced by `generateConfig`. */
export type PluginCodegenResult = {
  imports: ImportDeclarationStructure[];
  pluginInit: string;
  categories?: CategoryConfig[];
};

/**
 * Defines how a plugin integrates with the setup wizard.
 *
 * Each supported plugin provides a binding that controls:
 * - Pre-selection: `isRecommended` detects if the plugin is relevant for the repository
 * - Configuration: `prompts` collect plugin-specific options interactively
 * - Code generation: `generateConfig` produces the import and initialization code
 */
export type PluginSetupBinding = {
  slug: PluginMeta['slug'];
  title: PluginMeta['title'];
  packageName: NonNullable<PluginMeta['packageName']>;
  scope?: 'project' | 'root';
  prompts?: (targetDir: string) => Promise<PluginPromptDescriptor[]>;
  isRecommended?: (targetDir: string) => Promise<boolean>;
  generateConfig: (
    answers: Record<string, string | string[]>,
  ) => PluginCodegenResult;
};
