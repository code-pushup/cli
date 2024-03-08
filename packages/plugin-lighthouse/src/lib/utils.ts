import { type CliFlags } from 'lighthouse';
import { Result } from 'lighthouse/types/lhr/audit-result';
import { Audit, AuditOutput, AuditOutputs, Group } from '@code-pushup/models';
import { filterItemRefsBy, objectToCliArgs, toArray } from '@code-pushup/utils';
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

export function toAuditOutputs(lhrAudits: Result[]): AuditOutputs {
  return lhrAudits.map(
    ({
      id: slug,
      score,
      numericValue: value = 0, // not every audit has a numericValue
      details,
      displayValue,
    }: Result) => {
      const auditOutput: AuditOutput = {
        slug,
        score: score ?? 1, // score can be null
        value: Number.parseInt(value.toString(), 10),
        displayValue,
      };

      if (details == null) {
        return auditOutput;
      }

      // @TODO implement switch case for detail parsing. Related to #90
      const unsupportedType = details.type;
      // @TODO use cliui.logger.info Resolve TODO after PR #487 is merged.
      // eslint-disable-next-line no-console
      console.log(
        `Parsing details from type ${unsupportedType} is not implemented.`,
      );

      return auditOutput;
    },
  );
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
  const missingCategories = toArray(onlyCategories).filter(slug =>
    groups.every(group => group.slug !== slug),
  );
  if (missingCategories.length > 0) {
    throw new CategoriesNotImplementedError(missingCategories);
  }
  return true;
}

export function filterAuditsAndGroupsByOnlyOptions(
  audits: Audit[],
  groups: Group[],
  options?: Pick<CliFlags, 'onlyAudits' | 'onlyCategories'>,
): {
  audits: Audit[];
  groups: Group[];
} {
  const { onlyAudits, onlyCategories } = options ?? {};

  // category wins over audits
  if (onlyCategories && onlyCategories.length > 0) {
    validateOnlyCategories(groups, onlyCategories);

    const categorieSlugs = new Set(onlyCategories);
    const filteredGroups: Group[] = groups.filter(({ slug }) =>
      categorieSlugs.has(slug),
    );
    const auditSlugsFromRemainingGroups = new Set(
      filteredGroups.flatMap(({ refs }) => refs.map(({ slug }) => slug)),
    );
    return {
      audits: audits.filter(({ slug }) =>
        auditSlugsFromRemainingGroups.has(slug),
      ),
      groups: filteredGroups,
    };
  } else if (onlyAudits && onlyAudits.length > 0) {
    validateOnlyAudits(audits, onlyAudits);
    const auditSlugs = new Set(onlyAudits);
    return {
      audits: audits.filter(({ slug }) => auditSlugs.has(slug)),
      groups: filterItemRefsBy(groups, ({ slug }) => auditSlugs.has(slug)),
    };
  }
  // return unchanged
  return {
    audits,
    groups,
  };
}
