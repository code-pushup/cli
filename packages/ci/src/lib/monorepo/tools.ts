import type { ProcessObserver } from '@code-pushup/utils';

export const MONOREPO_TOOLS = ['nx', 'turbo', 'yarn', 'pnpm', 'npm'] as const;
export type MonorepoTool = (typeof MONOREPO_TOOLS)[number];

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
  observer?: ProcessObserver;
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

export function isMonorepoTool(value: string): value is MonorepoTool {
  return MONOREPO_TOOLS.includes(value as MonorepoTool);
}
