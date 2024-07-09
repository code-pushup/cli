import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export type GeneralExecutorOnlyOptions = {
  dryRun?: boolean;
};

export type PersistExecutorOptions = {
  projectPrefix?: string;
};

export type BaseNormalizedExecutorContext = {
  projectConfig?: ProjectConfiguration;
} & { workspaceRoot: string };
