import chalk from 'chalk';
import { ui } from '@code-pushup/utils';
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
  'precomputedLanternDataPath', // @TODO add description
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

  const unsupportedFlagsInUse = Object.keys(prefilledFlags).filter(flag =>
    LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS.has(flag as UnsupportedCliFlags),
  );

  if (unsupportedFlagsInUse.length > 0) {
    ui().logger.info(
      `${chalk.yellow(
        '⚠',
      )} The following used flags are not supported: ${chalk.bold(
        unsupportedFlagsInUse.join(', '),
      )}`,
    );
  }

  return Object.fromEntries(
    Object.entries(prefilledFlags)
      .filter(
        ([flagName]) =>
          !LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS.has(
            flagName as UnsupportedCliFlags,
          ),
      )
      // in code-pushup lighthouse categories are mapped as groups, therefor we had to rename "onlyCategories" to "onlyGroups" for the user of the plugin
      .map(([key, v]) => [key === 'onlyGroups' ? 'onlyCategories' : key, v])
      // undefined | string | string[] => string[] (empty for undefined)
      .map(([key, v]) => {
        if (!REFINED_STRING_OR_STRING_ARRAY.has(key as never)) {
          return [key, v];
        }
        return [key, Array.isArray(v) ? v : v == null ? [] : [v]];
      }),
  ) as LighthouseCliFlags;
}
