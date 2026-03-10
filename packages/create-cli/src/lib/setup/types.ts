import type { PluginMeta } from '@code-pushup/models';
import type { MonorepoTool } from '@code-pushup/utils';

export const CI_PROVIDERS = ['github', 'gitlab', 'skip'] as const;
export type CiProvider = (typeof CI_PROVIDERS)[number];

export const CONFIG_FILE_FORMATS = ['ts', 'js', 'mjs'] as const;
export type ConfigFileFormat = (typeof CONFIG_FILE_FORMATS)[number];

export const SETUP_MODES = ['standalone', 'monorepo'] as const;
export type SetupMode = (typeof SETUP_MODES)[number];

export const PLUGIN_SCOPES = ['project', 'root'] as const;
export type PluginScope = (typeof PLUGIN_SCOPES)[number];

export type CliArgs = {
  'dry-run'?: boolean;
  yes?: boolean;
  'config-format'?: string;
  mode?: SetupMode;
  plugins?: string[];
  ci?: string;
  'target-dir'?: string;
  [key: string]: unknown;
};

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
  // TODO: add categories support (categoryRefs for generated categories array)
};

export type ScopedPluginResult = {
  scope: PluginScope;
  result: PluginCodegenResult;
};

/** Context describing the current setup mode, passed to plugin codegen. */
export type ConfigContext = {
  mode: SetupMode;
  tool: MonorepoTool | null;
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
  prompts?: PluginPromptDescriptor[];
  scope?: PluginScope;
  isRecommended?: (targetDir: string) => Promise<boolean>;
  generateConfig: (
    answers: Record<string, string | string[]>,
    context: ConfigContext,
  ) => PluginCodegenResult;
};

/** A project discovered in a monorepo workspace. */
export type WizardProject = {
  name: string;
  directory: string;
  relativeDir: string;
};

export type WriteContext = {
  tree: Tree;
  format: ConfigFileFormat;
  configFilename: string;
  isEsm: boolean;
};

/** A single file operation recorded by the virtual tree. */
export type FileChange = {
  path: string;
  type: 'CREATE' | 'UPDATE';
  content: string;
};

/** Virtual file system that buffers writes in memory until flushed to disk. */
export type Tree = {
  root: string;
  exists: (filePath: string) => Promise<boolean>;
  read: (filePath: string) => Promise<string | null>;
  write: (filePath: string, content: string) => Promise<void>;
  listChanges: () => FileChange[];
  flush: () => Promise<void>;
};

/** Abstraction over `node:fs` used by the virtual tree for disk I/O. */
export type FileSystemAdapter = {
  readFile: (path: string, encoding: 'utf8') => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  mkdir: (
    path: string,
    options: { recursive: true },
  ) => Promise<string | undefined>;
};
