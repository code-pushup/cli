import type { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

/**
 * Types used in the executor only
 */
export type GeneralExecutorOnlyOptions = {
  dryRun?: boolean;
};

/**
 * executor types that apply for a subset of exector's.
 * In this case the project related options
 *
 */
export type ProjectExecutorOnlyOptions = {
  projectPrefix?: string;
};

/**
 * CLI types that apply globally for all commands.
 */
export type Command =
  | 'collect'
  | 'upload'
  | 'autorun'
  | 'print-config'
  | 'compare'
  | 'merge-diffs'
  | 'history';
export type GlobalExecutorOptions = {
  command?: Command;
  bin?: string;
  verbose?: boolean;
  config?: string;
};

/**
 * CLI types that apply for a subset of commands.
 * In this case the collection of data (collect, autorun, history)
 */
export type CollectExecutorOnlyOptions = {
  onlyPlugins?: string[];
};

/**
 * context that is normalized for all executor's
 */
export type BaseNormalizedExecutorContext = {
  projectConfig?: ProjectConfiguration;
} & { workspaceRoot: string };
