import { objectToCliArgs, toArray } from '@code-pushup/utils';
import { LIGHTHOUSE_REPORT_NAME } from './constants';
import { LighthousePluginOptions } from './lighthouse-plugin';

export type ChromeFlage = { headless?: false | 'new'; userDataDir?: string };
export type LighthouseCliOptions = Omit<
  LighthousePluginOptions,
  'headless' | 'onlyAudits'
> & {
  onlyAudits?: string[];
  onlyCategories?: string[];
} & ChromeFlage;

export function getLighthouseCliArguments(
  options: LighthouseCliOptions,
): string[] {
  const {
    url,
    outputPath = LIGHTHOUSE_REPORT_NAME,
    onlyAudits = [],
    verbose = false,
    headless = false,
    userDataDir,
  } = options;

  // eslint-disable-next-line functional/no-let
  let argsObj: Record<string, unknown> = {
    _: ['lighthouse', url],
    verbose,
    output: 'json',
    'output-path': outputPath,
  };

  if (onlyAudits.length > 0) {
    argsObj = {
      ...argsObj,
      onlyAudits: toArray(onlyAudits),
    };
  }

  // handle chrome flags
  // eslint-disable-next-line functional/no-let
  let chromeFlags: Array<string> = [];
  if (headless) {
    chromeFlags = [...chromeFlags, `--headless=${headless}`];
  }
  if (userDataDir) {
    chromeFlags = [...chromeFlags, `--user-data-dir=${userDataDir}`];
  }
  if (chromeFlags.length > 0) {
    argsObj = {
      ...argsObj,
      ['chrome-flags']: chromeFlags.join(' '),
    };
  }

  return objectToCliArgs(argsObj);
}
