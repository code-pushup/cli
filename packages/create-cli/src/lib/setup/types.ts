import type { PluginMeta } from '@code-pushup/models';

export type ConfigFileFormat = 'ts' | 'js' | 'mjs';

/** Virtual file system that buffers writes in memory until flushed to disk. */
export type Tree = {
  root: string;
  exists: (filePath: string) => Promise<boolean>;
  read: (filePath: string) => Promise<string | null>;
  write: (filePath: string, content: string) => Promise<void>;
  listChanges: () => FileChange[];
  flush: () => Promise<void>;
};

export type FileChange = {
  path: string;
  type: 'CREATE' | 'UPDATE';
  content: string;
};

export type FileSystemAdapter = {
  readFile: (path: string, encoding: 'utf8') => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  mkdir: (
    path: string,
    options: { recursive: true },
  ) => Promise<string | undefined>;
};

export type PluginSetupBinding = {
  slug: PluginMeta['slug'];
  title: PluginMeta['title'];
  packageName: NonNullable<PluginMeta['packageName']>;
  // TODO: #1244 — add async pre-selection callback (e.g. detect eslint.config.js in repo)
  prompts?: PluginPromptDescriptor[];
  generateConfig: (
    answers: Record<string, string | string[]>,
  ) => PluginCodegenResult;
};

export type ImportDeclarationStructure = {
  moduleSpecifier: string;
  defaultImport?: string;
  namedImports?: string[];
  isTypeOnly?: boolean;
};

export type PluginCodegenResult = {
  imports: ImportDeclarationStructure[];
  pluginInit: string;
  // TODO: #1244 — add categories support (categoryRefs for generated categories array)
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

export type PluginPromptDescriptor =
  | InputPrompt
  | SelectPrompt
  | CheckboxPrompt;

export type CliArgs = {
  'dry-run'?: boolean;
  yes?: boolean;
  'config-format'?: string;
  // TODO: #1244 — add 'plugins' field for CLI-based plugin selection
  'target-dir'?: string;
  [key: string]: unknown;
};
