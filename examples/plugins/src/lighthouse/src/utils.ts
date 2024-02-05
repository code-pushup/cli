import Result from 'lighthouse/types/lhr/lhr';
import { Issue, MAX_ISSUE_MESSAGE_LENGTH } from '@code-pushup/models';
import { objectToCliArgs, toArray } from '@code-pushup/utils';
import { LIGHTHOUSE_REPORT_NAME } from './constants';
import type { LighthouseCliOptions } from './types';

export class AuditsNotImplementedError extends Error {
  constructor(list: WithSlug[], auditSlugs: string[]) {
    super(
      `audits: "${auditSlugs
        .filter(slug => !list.some(a => a.slug === slug))
        .join(', ')}" not implemented`,
    );
  }
}

export function filterRefsBySlug<T extends { refs: WithSlug[] }>(
  group: T,
  auditSlugs: string[],
): T {
  if (auditSlugs.length === 0) {
    return group;
  }
  const groupsRefs =
    auditSlugs.length === 0 ? group.refs : filterBySlug(group.refs, auditSlugs);

  return {
    ...group,
    refs: groupsRefs,
  };
}
export type WithSlug = { slug: string };

export function filterBySlug<T extends WithSlug>(
  list: T[],
  auditSlugs: string[],
): T[] {
  if (auditSlugs.length === 0) {
    return list;
  }
  if (auditSlugs.some(slug => !list.some(wS => wS.slug === slug))) {
    throw new AuditsNotImplementedError(list, auditSlugs);
  }

  return list.filter(({ slug }) => auditSlugs.includes(slug));
}

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
        source: {
          file: 'required-in-portal-api',
        },
      },
    ];
  }

  return null;
}
