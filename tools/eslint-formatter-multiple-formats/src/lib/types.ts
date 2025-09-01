import type { EslintFormat, PersistConfig } from './utils.js';

export type FormatterConfig = Omit<PersistConfig, 'format'> & {
  projectsDir?: string; // e.g. 'apps' or 'packages' to make paths relative to these folders
  projectName?: string; // e.g. 'utils' or 'models' also auto-derived for Nx environment variables
  formats?: EslintFormat[];
  terminal?: EslintFormat;
};
