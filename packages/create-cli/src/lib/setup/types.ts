import type { PluginCodegenResult } from '@code-pushup/models';
import type { MonorepoTool, Tree } from '@code-pushup/utils';

export type {
  CategoryCodegenConfig,
  ImportDeclarationStructure,
  PluginAnswer,
  PluginCodegenInput,
  PluginCodegenResult,
  PluginPromptDescriptor,
  PluginSetupBinding,
  PluginSetupTree,
} from '@code-pushup/models';

export type { FileChange, FileSystemAdapter, Tree } from '@code-pushup/utils';

export const CI_PROVIDERS = ['github', 'gitlab', 'none'] as const;
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

export type ScopedPluginResult = {
  scope: PluginScope;
  result: PluginCodegenResult;
};

/** Context describing the current setup mode, passed to plugin codegen. */
export type ConfigContext = {
  mode: SetupMode;
  tool: MonorepoTool | null;
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
