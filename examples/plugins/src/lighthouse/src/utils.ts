import type { Result } from 'lighthouse';
import { type Issue, MAX_ISSUE_MESSAGE_LENGTH } from '@code-pushup/models';
import { objectToCliArgs, toArray } from '@code-pushup/utils';
import { LIGHTHOUSE_REPORT_NAME } from './constants.js';
import type { LighthouseCliOptions } from './types.js';

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
  let chromeFlags: string[] = [];
  if (headless) {
    chromeFlags = [...chromeFlags, `--headless=${headless}`];
  }
  if (userDataDir) {
    chromeFlags = [...chromeFlags, `--user-data-dir=${userDataDir}`];
  }
  if (chromeFlags.length > 0) {
    argsObj = {
      ...argsObj,
      'chrome-flags': chromeFlags.join(' '),
    };
  }

  return objectToCliArgs(argsObj);
}

export function lhrDetailsToIssueDetails(
  details = {} as unknown as Result['audits'][string]['details'],
): Issue[] | null {
  const { type, items } = details as {
    type: string;
    items: Record<string, string>[];
    /**
     * @TODO implement cases
     * - undefined,
     * - 'filmstrip',
     * - 'screenshot',
     * - 'debugdata',
     * - 'opportunity',
     * - 'criticalrequestchain',
     * - 'list',
     * - 'treemap-data'
     */
  };
  if (type === 'table') {
    return [
      {
        message: items
          .map((item: Record<string, string>) =>
            Object.entries(item).map(([key, value]) => `${key}-${value}`),
          )
          .join(',')
          .slice(0, MAX_ISSUE_MESSAGE_LENGTH),
        severity: 'info',
      },
    ];
  }

  return null;
}
