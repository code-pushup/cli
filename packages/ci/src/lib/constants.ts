import type { Settings } from './models';

export const DEFAULT_SETTINGS: Settings = {
  monorepo: false,
  projects: null,
  task: 'code-pushup',
  bin: 'npx --no-install code-pushup',
  config: null,
  directory: process.cwd(),
  silent: false,
  debug: false,
  detectNewIssues: true,
  logger: console,
};
