import { bold, yellow } from 'ansis';
import { ui } from '@code-pushup/utils';
import { LIGHTHOUSE_PLUGIN_SLUG } from './constants';
import { DEFAULT_CLI_FLAGS, LighthouseCliFlags } from './runner';
import type { LighthouseOptions } from './types';

const { onlyCategories, ...originalDefaultCliFlags } = DEFAULT_CLI_FLAGS;
export const DEFAULT_LIGHTHOUSE_OPTIONS = {
  ...originalDefaultCliFlags,
  onlyGroups: onlyCategories,
} satisfies LighthouseOptions;

// NOTE:
// This is an intermediate variable to get `UnsupportedCliFlags`. For unknown reasons `typescript@5.3.3` doesn't work otherwise.
const lighthouseUnsupportedCliFlags = [
  'precomputedLanternDataPath', // Path to the file where precomputed lantern data should be read from.
  'chromeIgnoreDefaultFlags', // ignore default flags from Lighthouse CLI
  // No error reporting implemented as in the source Sentry was involved
  // See: https://github.com/GoogleChrome/lighthouse/blob/d8ccf70692216b7fa047a4eaa2d1277b0b7fe947/cli/bin.js#L124
  'enableErrorReporting', // enable error reporting
  // lighthouse CLI specific debug logs
  'list-all-audits', // Prints a list of all available audits and exits.
  'list-locales', // Prints a list of all supported locales and exits.
  'list-trace-categories', // Prints a list of all required trace categories and exits.
] as const;
type UnsupportedCliFlags = (typeof lighthouseUnsupportedCliFlags)[number];

const LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS = new Set(lighthouseUnsupportedCliFlags);

const REFINED_STRING_OR_STRING_ARRAY = new Set([
  'onlyAudits',
  'onlyCategories',
  'skipAudits',
  'budgets',
  'chromeFlags',
]);

export function normalizeFlags(flags?: LighthouseOptions): LighthouseCliFlags {
  const prefilledFlags = { ...DEFAULT_LIGHTHOUSE_OPTIONS, ...flags };

  logUnsupportedFlagsInUse(prefilledFlags);

  return Object.fromEntries(
    Object.entries(prefilledFlags)
      .filter(
        ([flagName]) =>
          !LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS.has(
            flagName as UnsupportedCliFlags,
          ),
      )
      // in code-pushup lighthouse categories are mapped as groups, therefor we had to rename "onlyCategories" to "onlyGroups" for the user of the plugin as it was confusing
      .map(([key, v]) => [key === 'onlyGroups' ? 'onlyCategories' : key, v])
      // onlyAudits and onlyCategories cannot be empty arrays, otherwise skipAudits is ignored by lighthouse
      .filter(([_, v]) => !(Array.isArray(v) && v.length === 0))
      // undefined | string | string[] => string[] (empty for undefined)
      .map(([key, v]) => {
        if (!REFINED_STRING_OR_STRING_ARRAY.has(key as never)) {
          return [key, v];
        }
        return [key, Array.isArray(v) ? v : v == null ? [] : [v]];
      }),
  ) as LighthouseCliFlags;
}

export function logUnsupportedFlagsInUse(
  flags: LighthouseOptions,
  displayCount = 3,
) {
  const unsupportedFlagsInUse = Object.keys(flags).filter(flag =>
    LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS.has(flag as UnsupportedCliFlags),
  );
  if (unsupportedFlagsInUse.length > 0) {
    const postFix = (count: number) =>
      count > displayCount ? ` and ${count - displayCount} more.` : '';
    ui().logger.debug(
      `${yellow('⚠')} Plugin ${bold(
        LIGHTHOUSE_PLUGIN_SLUG,
      )} used unsupported flags: ${bold(
        unsupportedFlagsInUse.slice(0, displayCount).join(', '),
      )}${postFix(unsupportedFlagsInUse.length)}`,
    );
  }
}
