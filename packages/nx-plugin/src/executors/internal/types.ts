import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export type GeneralExecutorOnlyOptions = {
  dryRun?: boolean;
};

export type CollectExecutorOnlyOptions = {
  onlyPlugins?: [];
};

export type PersistExecutorOnlyOptions = {
  projectPrefix?: string;
};

export type BaseNormalizedExecutorContext = {
  projectConfig?: ProjectConfiguration;
} & { workspaceRoot: string };
