import type { MonorepoTool } from '@code-pushup/utils';

export type MonorepoToolHandler = {
  tool: MonorepoTool;
  isConfigured: (options: MonorepoHandlerOptions) => Promise<boolean>;
  listProjects: (options: MonorepoHandlerOptions) => Promise<ProjectConfig[]>;
  createRunManyCommand: (
    options: MonorepoHandlerOptions,
    projects: MonorepoHandlerProjectsContext,
  ) => string | Promise<string>;
};

export type MonorepoHandlerOptions = {
  task: string;
  cwd: string;
  parallel: boolean | number;
  nxProjectsFilter: string | string[];
};

export type MonorepoHandlerProjectsContext = {
  only?: string[];
  all: ProjectConfig[];
};

export type ProjectConfig = {
  name: string;
  bin: string;
  directory?: string;
};
