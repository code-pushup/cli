import { join } from 'node:path';
import { DEFAULT_PERSIST_OUTPUT_DIR } from '@code-pushup/models';

export const LIGHTHOUSE_PLUGIN_SLUG = 'lighthouse';
export const LIGHTHOUSE_OUTPUT_PATH = join(
  DEFAULT_PERSIST_OUTPUT_DIR,
  LIGHTHOUSE_PLUGIN_SLUG,
);

// intermediate variable to get `UnsupportedCliFlags`
const lighthouseUnsupportedCliFlags = [
  'precomputedLanternDataPath', // @TODO add description
  // No error reporting implemented as in the source Sentry was involved
  // See: https://github.com/GoogleChrome/lighthouse/blob/d8ccf70692216b7fa047a4eaa2d1277b0b7fe947/cli/bin.js#L124
  'enableErrorReporting', // enable error reporting
  'view', // Open HTML report in your browser
  // lighthouse CLI specific debug logs
  'list-all-audits', // Prints a list of all available audits and exits.
  'list-locales', // Prints a list of all supported locales and exits.
  'list-trace-categories', // Prints a list of all required trace categories and exits.
] as const;

export type UnsupportedCliFlags =
  (typeof lighthouseUnsupportedCliFlags)[number];
export const LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS = new Set(
  lighthouseUnsupportedCliFlags,
);
