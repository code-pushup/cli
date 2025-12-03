import { SchemaValidationError, validate } from '@code-pushup/models';
import type { ConfigPatterns, Settings } from './models.js';
import { configPatternsSchema } from './schemas.js';

export const DEFAULT_SETTINGS: Settings = {
  monorepo: false,
  parallel: false,
  projects: null,
  task: 'code-pushup',
  bin: 'npx --no-install code-pushup',
  config: null,
  directory: process.cwd(),
  silent: false,
  detectNewIssues: true,
  nxProjectsFilter: '--with-target={task}',
  skipComment: false,
  configPatterns: null,
  searchCommits: false,
  jobId: null,
};

export const MIN_SEARCH_COMMITS = 1;
export const MAX_SEARCH_COMMITS = 100;

export function parseConfigPatternsFromString(
  value: string,
): ConfigPatterns | null {
  if (!value) {
    return null;
  }

  try {
    const json = JSON.parse(value);
    return validate(configPatternsSchema, json);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new TypeError(
        `Invalid JSON value for configPatterns input - ${error.message}`,
      );
    }
    if (error instanceof SchemaValidationError) {
      throw new TypeError(`Invalid shape of configPatterns input:\n${error}`);
    }
    throw error;
  }
}
