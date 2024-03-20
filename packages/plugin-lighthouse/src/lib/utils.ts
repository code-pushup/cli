import chalk from 'chalk';
import { type Budget, type CliFlags, type Config } from 'lighthouse';
import log from 'lighthouse-logger';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import experimentalConfig from 'lighthouse/core/config/experimental-config.js';
import perfConfig from 'lighthouse/core/config/perf-config.js';
import { Result } from 'lighthouse/types/lhr/audit-result';
import path from 'node:path';
import { Audit, AuditOutput, AuditOutputs, Group } from '@code-pushup/models';
import {
  filterItemRefsBy,
  importEsmModule,
  objectToCliArgs,
  readJsonFile,
  toArray,
  ui,
} from '@code-pushup/utils';
import { LIGHTHOUSE_REPORT_NAME } from './constants';
import { type LighthouseCliFlags } from './lighthouse-plugin';

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
      ui().logger.info(
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

export async function getConfig(
  flags: Pick<LighthouseCliFlags, 'configPath' | 'preset'> = {},
): Promise<Config | undefined> {
  const { configPath: filepath, preset } = flags;

  if (filepath != null) {
    // Resolve the config file path relative to where cli was called.

    if (filepath.endsWith('.json')) {
      return readJsonFile<Config>(filepath);
    } else if (/\.(ts|js|mjs)$/.test(filepath)) {
      return importEsmModule<Config>({ filepath });
    }
  } else if (typeof preset === 'string') {
    switch (preset) {
      case 'desktop':
        return desktopConfig;
      case 'perf':
        return perfConfig as Config;
      case 'experimental':
        return experimentalConfig as Config;
      default:
        // as preset is a string literal the default case here is normally caught by TS and not possible to happen. Now in reality it can happen and preset could be a string not included in the literal.
        // Therefor we have to use `as string` is used. Otherwise, it will consider preset as type never
        ui().logger.info(`Preset "${preset as string}" is not supported`);
    }
  }
  return undefined;
}

export async function getBudgets(
  budgetPath?: string | null,
): Promise<Budget[]> {
  if (budgetPath) {
    /** @type {Array<LH.Budget>} */
    return await readJsonFile<Budget[]>(
      path.resolve(process.cwd(), budgetPath),
    );
  }
  return [];
}

export function setLogLevel({
  verbose,
  quiet,
}: {
  verbose?: boolean;
  quiet?: boolean;
} = {}) {
  // set logging preferences
  if (verbose) {
    log.setLevel('verbose');
  } else if (quiet) {
    log.setLevel('silent');
  } else {
    log.setLevel('info');
  }
}

const excludedFlags = new Set([
  // lighthouse CLI specific debug logs
  'list-all-audits', // Prints a list of all available audits and exits.
  'list-locales', // Prints a list of all supported locales and exits.
  'list-trace-categories', // Prints a list of all required trace categories and exits.
]);

export function validateFlags(
  flags: LighthouseCliFlags = {},
): LighthouseCliFlags {
  const unsupportedFlagsInUse = Object.keys(flags).filter(flag =>
    excludedFlags.has(flag),
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
    Object.entries(flags).filter(([flagName]) => !excludedFlags.has(flagName)),
  );
}
