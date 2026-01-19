import { DEFAULT_FLAGS } from 'chrome-launcher/dist/flags.js';
import path from 'node:path';
import { DEFAULT_PERSIST_OUTPUT_DIR } from '@code-pushup/models';

// headless is needed to pass CI on Linux and Windows (locally it works without headless too)
export const DEFAULT_CHROME_FLAGS = [...DEFAULT_FLAGS, '--headless'];

export const LIGHTHOUSE_PLUGIN_SLUG = 'lighthouse';
export const LIGHTHOUSE_PLUGIN_TITLE = 'Lighthouse';

export const LIGHTHOUSE_OUTPUT_PATH = path.join(
  DEFAULT_PERSIST_OUTPUT_DIR,
  LIGHTHOUSE_PLUGIN_SLUG,
);

export const LIGHTHOUSE_GROUP_SLUGS = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
] as const;

export const SINGLE_URL_THRESHOLD = 1;
