import { join } from 'node:path';
import { DEFAULT_PERSIST_OUTPUT_DIR } from '@code-pushup/models';

export const LIGHTHOUSE_PLUGIN_SLUG = 'lighthouse';
export const LIGHTHOUSE_OUTPUT_PATH = join(
  DEFAULT_PERSIST_OUTPUT_DIR,
  LIGHTHOUSE_PLUGIN_SLUG,
);
