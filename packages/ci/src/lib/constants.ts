import type { Settings } from './models.js';

export const DEFAULT_SETTINGS: Settings = {
  monorepo: false,
  parallel: false,
  projects: null,
  task: 'code-pushup',
  bin: 'npx --no-install code-pushup',
  config: null,
  directory: process.cwd(),
  silent: false,
  debug: false,
  detectNewIssues: true,
  logger: console,
  nxProjectsFilter: '--with-target={task}',
  skipComment: false,
  configPatterns: null,
  searchCommits: false,
};

export const MIN_SEARCH_COMMITS = 1;
export const MAX_SEARCH_COMMITS = 100;
