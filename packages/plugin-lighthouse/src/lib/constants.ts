export const LIGHTHOUSE_PLUGIN_SLUG = 'lighthouse';

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

export function isUnsupportedFlag<T extends string>(flag: T) {
  return LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS.has(flag as UnsupportedCliFlags);
}
export function isSupportedFlag<T extends string>(flag: T) {
  return !LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS.has(flag as UnsupportedCliFlags);
}
