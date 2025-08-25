import type { Format, PersistConfig } from '../persist-config.js';

export const DEFAULT_PERSIST_OUTPUT_DIR = '.code-pushup';
export const DEFAULT_PERSIST_FILENAME = 'report';
export const DEFAULT_PERSIST_FORMAT: Format[] = ['json', 'md'];
export const DEFAULT_PERSIST_SKIP_REPORT = false;

export const DEFAULT_PERSIST_CONFIG: Required<PersistConfig> = {
  outputDir: DEFAULT_PERSIST_OUTPUT_DIR,
  filename: DEFAULT_PERSIST_FILENAME,
  format: DEFAULT_PERSIST_FORMAT,
  skipReports: DEFAULT_PERSIST_SKIP_REPORT,
};
