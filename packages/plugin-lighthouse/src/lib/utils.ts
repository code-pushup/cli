import type { CliFlags as LighthouseFlags } from 'lighthouse';
import { Audit, Group, GroupRef } from '@code-pushup/models';
import {
  filterBy,
  filterItemsWithRefBy,
  objectToCliArgs,
  toArray,
} from '@code-pushup/utils';
import { LIGHTHOUSE_REPORT_NAME } from './constants';

type RefinedLighthouseOption = {
  url: LighthouseFlags['_'];
  chromeFlags?: Record<LighthouseFlags['chromeFlags'][number], string>;
};
export type LighthouseCliOptions = RefinedLighthouseOption &
  Partial<Omit<LighthouseFlags, keyof RefinedLighthouseOption>>;

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
  constructor(auditSlugs: string[]) {
    super(`audits: "${auditSlugs.join(', ')}" not implemented`);
  }
}

export function validateOnlyAudits(
  audits: Audit[],
  onlyAudits: string | string[],
): boolean {
  const missingAudtis = toArray(onlyAudits).filter(
    slug => !audits.some(audit => audit.slug === slug),
  );
  if (missingAudtis.length > 0) {
    throw new AuditsNotImplementedError(missingAudtis);
  }
  return true;
}

export class CategoriesNotImplementedError extends Error {
  constructor(categorySlugs: string[]) {
    super(`categories: "${categorySlugs.join(', ')}" not implemented`);
  }
}

export function validateOnlyCategories(
  groups: Group[],
  onlyCategories: string | string[],
): boolean {
  const missingCategories = toArray(onlyCategories).filter(
    slug => !groups.some(group => group.slug === slug),
  );
  if (missingCategories.length > 0) {
    throw new CategoriesNotImplementedError(missingCategories);
  }
  return true;
}

export function filterAuditsAndGroupsByOnlyOptions(
  audits: Audit[],
  groups: Group[],
  options?: Pick<LighthouseFlags, 'onlyAudits' | 'onlyCategories'>,
): {
  audits: Audit[];
  groups: Group[];
} {
  const { onlyAudits, onlyCategories } = options ?? {};

  // category wins over audits
  if (onlyCategories && onlyCategories.length > 0) {
    validateOnlyCategories(groups, onlyCategories);
    const categorieSlugs = new Set(onlyCategories);
    const filteredGroups: Group[] = filterBy<Group>(groups, ({ slug }) =>
      categorieSlugs.has(slug),
    );
    const auditSlugsFromRemainingGroups = new Set(
      filteredGroups.flatMap(({ refs }) => refs.map(({ slug }) => slug)),
    );
    return {
      audits: filterBy<Audit>(audits, ({ slug }) =>
        auditSlugsFromRemainingGroups.has(slug),
      ),
      groups: filteredGroups,
    };
  } else if (onlyAudits && onlyAudits.length > 0) {
    validateOnlyAudits(audits, onlyAudits);
    const auditSlugs = new Set(onlyAudits);
    return {
      audits: filterBy<Audit>(audits, ({ slug }) => auditSlugs.has(slug)),
      groups: filterItemsWithRefBy<GroupRef>(groups, ({ slug }) =>
        auditSlugs.has(slug),
      ) as Group[],
    };
  }
  // return unchanged
  return {
    audits,
    groups,
  };
}
