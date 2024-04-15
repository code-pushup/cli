import { ProjectConfiguration } from 'nx/src/config/workspace-json-project-json';

export type BaseNormalizedExecutorContext = {
  projectConfig?: ProjectConfiguration;
} & { workspaceRoot: string };
