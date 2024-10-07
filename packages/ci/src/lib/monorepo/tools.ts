import type { ProcessObserver } from '@code-pushup/utils';

export const MONOREPO_TOOLS = ['nx', 'turbo', 'yarn', 'pnpm', 'npm'] as const;
export type MonorepoTool = (typeof MONOREPO_TOOLS)[number];

export type MonorepoToolHandler = {
  tool: MonorepoTool;
  isConfigured: (options: MonorepoHandlerOptions) => Promise<boolean>;
  listProjects: (options: MonorepoHandlerOptions) => Promise<ProjectConfig[]>;
};

export type MonorepoHandlerOptions = {
  task: string;
  cwd: string;
  observer?: ProcessObserver;
};

export type ProjectConfig = {
  name: string;
  bin: string;
  directory?: string;
};
