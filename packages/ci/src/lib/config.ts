import type { MonorepoTool } from './monorepo';

export type CIConfigInput = {
  monorepo?: boolean | MonorepoTool;
  projects?: string[] | null;
  task?: string;
  bin?: string;
  config?: string | null;
  directory?: string;
  silent?: boolean;
  annotations?: boolean;
  logger: CILogger;
};

export type CIConfig = Required<CIConfigInput>;

export const CI_CONFIG_DEFAULTS = {
  monorepo: false,
  projects: null,
  task: 'code-pushup',
  bin: 'npx --no-install code-pushup',
  config: null,
  directory: process.cwd(),
  silent: false,
  annotations: true,
  logger: console,
} satisfies Partial<CIConfig>;

export type CILogger = {
  error: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
  debug: (message: string) => void;
};
