import type { CliFlags } from 'lighthouse';
import { objectToCliArgs, toArray } from '@code-pushup/utils';
import { LIGHTHOUSE_REPORT_NAME } from './constants';

type RefinedLighthouseOption = {
  url: CliFlags['_'];
  chromeFlags?: Record<CliFlags['chromeFlags'][number], string>;
};
export type LighthouseCliOptions = RefinedLighthouseOption &
  Partial<Omit<CliFlags, keyof RefinedLighthouseOption>>;

export function getLighthouseCliArguments(
  options: LighthouseCliOptions,
): string[] {
  const {
    url,
    outputPath = LIGHTHOUSE_REPORT_NAME,
    onlyAudits = [],
    output = 'json',
    verbose = false,
    chromeFlags = {},
  } = options;

  // eslint-disable-next-line functional/no-let
  let argsObj: Record<string, unknown> = {
    _: ['lighthouse', url.join(',')],
    verbose,
    output,
    'output-path': outputPath,
  };

  if (onlyAudits != null && onlyAudits.length > 0) {
    argsObj = {
      ...argsObj,
      onlyAudits,
    };
  }

  // handle chrome flags
  if (Object.keys(chromeFlags).length > 0) {
    argsObj = {
      ...argsObj,
      chromeFlags: Object.entries(chromeFlags)
        .map(([key, value]) => `--${key}=${value}`)
        .join(' '),
    };
  }

  return objectToCliArgs(argsObj);
}

export class AuditsNotImplementedError extends Error {
  constructor(list: WithSlug[], auditSlugs: string[]) {
    super(
      `audits: "${auditSlugs
        .filter(slug => !list.some(a => a.slug === slug))
        .join(', ')}" not implemented`,
    );
  }
}

export function filterByAuditSlug<
  T extends {
    refs: WithSlug[];
  },
  S extends WithSlug['slug'] = T['refs'][number]['slug'],
>(groups: T[], auditSlugs: S | S[]): T[] {
  const slugs = toArray(auditSlugs);
  if (slugs.length === 0) {
    return groups;
  }
  return (
    groups
      // filter out groups that have no audits includes from onlyAudits (avoid empty groups)
      .filter(group => group.refs.some(({ slug }) => slugs.includes(slug as S)))
      .map(group => {
        const groupsRefs = group.refs.filter(({ slug }) =>
          slugs.includes(slug as S),
        );

        return {
          ...group,
          refs: groupsRefs,
        };
      })
  );
}

export type WithSlug = { slug: string };

export function filterBySlug<
  T extends WithSlug,
  S extends WithSlug['slug'] = WithSlug['slug'],
>(list: T[], auditSlugs: S | S[]): T[] {
  const slugs = toArray(auditSlugs);
  if (slugs.length === 0) {
    return list;
  }
  if (slugs.some(slug => !list.some(wS => wS.slug === slug))) {
    throw new AuditsNotImplementedError(list, slugs);
  }

  return list.filter(({ slug }) => slugs.includes(slug as S));
}
