import type { PluginMeta } from '@code-pushup/models';

/** Virtual file system that buffers writes in memory until flushed to disk. */
export type Tree = {
  root: string;
  exists: (filePath: string) => boolean;
  read: (filePath: string) => string | null;
  write: (filePath: string, content: string) => void;
  listChanges: () => FileChange[];
  flush: () => Promise<void>;
};

export type FileChange = {
  path: string;
  type: 'CREATE' | 'UPDATE';
  content: string;
};

export type FileSystemAdapter = {
  readFileSync: (path: string, encoding: 'utf8') => string;
  writeFileSync: (path: string, content: string) => void;
  existsSync: (path: string) => boolean;
  mkdirSync: (path: string, options: { recursive: boolean }) => void;
};

export type PluginSetupBinding = {
  slug: PluginMeta['slug'];
  title: PluginMeta['title'];
  packageName: NonNullable<PluginMeta['packageName']>;
  // TODO: #1244 — add async pre-selection callback (e.g. detect eslint.config.js in repo)
  prompts?: PluginPromptDescriptor[];
  codegenConfig: (
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
  // TODO: #1243 — add categories support (categoryRefs for generated categories array)
};

type PromptBase = {
  key: string;
  message: string;
};

type PromptChoice = { name: string; value: string };

type InputPrompt = PromptBase & {
  type: 'input';
  default: string;
};

type SelectPrompt = PromptBase & {
  type: 'select';
  choices: PromptChoice[];
  default: string;
};

type CheckboxPrompt = PromptBase & {
  type: 'checkbox';
  choices: PromptChoice[];
  default: string[];
};

export type PluginPromptDescriptor =
  | InputPrompt
  | SelectPrompt
  | CheckboxPrompt;

export type CliArgs = {
  'dry-run'?: boolean;
  yes?: boolean;
  // TODO: #1244 — add 'plugins' field for CLI-based plugin selection
  'target-dir'?: string;
  [key: string]: unknown;
};
