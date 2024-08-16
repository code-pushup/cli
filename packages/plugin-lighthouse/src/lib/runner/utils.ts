import { bold } from 'ansis';
import type { Config, FormattedIcu } from 'lighthouse';
import log from 'lighthouse-logger';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import experimentalConfig from 'lighthouse/core/config/experimental-config.js';
import perfConfig from 'lighthouse/core/config/perf-config.js';
import Details from 'lighthouse/types/lhr/audit-details';
import { Result } from 'lighthouse/types/lhr/audit-result';
import { AuditOutput, AuditOutputs } from '@code-pushup/models';
import {
  formatReportScore,
  importModule,
  readJsonFile,
  ui,
} from '@code-pushup/utils';
import type { LighthouseOptions } from '../types';
import { logUnsupportedDetails, toAuditDetails } from './details/details';
import { LighthouseCliFlags } from './types';

// @TODO fix https://github.com/code-pushup/cli/issues/612
export function normalizeAuditOutputs(
  auditOutputs: AuditOutputs,
  flags: LighthouseOptions = { skipAudits: [] },
): AuditOutputs {
  const toSkip = new Set(flags.skipAudits ?? []);
  return auditOutputs.filter(({ slug }) => {
    const doSkip = toSkip.has(slug);
    if (doSkip) {
      ui().logger.info(
        `Audit ${bold(
          slug,
        )} was included in audit outputs of lighthouse but listed under ${bold(
          'skipAudits',
        )}.`,
      );
    }
    return !doSkip;
  });
}

export class LighthouseAuditParsingError extends Error {
  constructor(slug: string, error: Error) {
    super(`\nAudit ${bold(slug)} failed parsing details: \n${error.message}`);
  }
}

function formatBaseAuditOutput(lhrAudit: Result): AuditOutput {
  const {
    id: slug,
    score,
    numericValue,
    displayValue,
    scoreDisplayMode,
  } = lhrAudit;
  return {
    slug,
    score: score ?? 1,
    value: numericValue ?? score ?? 0,
    displayValue:
      displayValue ??
      (scoreDisplayMode === 'binary'
        ? score === 1
          ? 'passed'
          : 'failed'
        : score
        ? `${formatReportScore(score)}%`
        : undefined),
  };
}

function processAuditDetails(
  auditOutput: AuditOutput,
  details: FormattedIcu<Details>,
): AuditOutput {
  try {
    const parsedDetails = toAuditDetails(details);
    return Object.keys(parsedDetails).length > 0
      ? { ...auditOutput, details: parsedDetails }
      : auditOutput;
  } catch (error) {
    throw new LighthouseAuditParsingError(auditOutput.slug, error as Error);
  }
}

export function toAuditOutputs(
  lhrAudits: Result[],
  { verbose = false }: { verbose?: boolean } = {},
): AuditOutputs {
  if (verbose) {
    logUnsupportedDetails(lhrAudits);
  }
  return lhrAudits.map(audit => {
    const auditOutput = formatBaseAuditOutput(audit);

    return audit.details == null
      ? auditOutput
      : processAuditDetails(auditOutput, audit.details);
  });
}

export type LighthouseLogLevel =
  | 'verbose'
  | 'error'
  | 'info'
  | 'silent'
  | 'warn'
  | undefined;
export function determineAndSetLogLevel({
  verbose,
  quiet,
}: {
  verbose?: boolean;
  quiet?: boolean;
} = {}): LighthouseLogLevel {
  // eslint-disable-next-line functional/no-let
  let logLevel: LighthouseLogLevel = 'info';
  // set logging preferences
  if (verbose) {
    logLevel = 'verbose';
  } else if (quiet) {
    logLevel = 'silent';
  }

  log.setLevel(logLevel);

  return logLevel;
}

export type ConfigOptions = Partial<
  Pick<LighthouseCliFlags, 'configPath' | 'preset'>
>;

export async function getConfig(
  options: ConfigOptions = {},
): Promise<Config | undefined> {
  const { configPath: filepath, preset } = options;

  if (filepath != null) {
    if (filepath.endsWith('.json')) {
      // Resolve the config file path relative to where cli was called.
      return readJsonFile<Config>(filepath);
    } else if (/\.(ts|js|mjs)$/.test(filepath)) {
      return importModule<Config>({ filepath, format: 'esm' });
    } else {
      ui().logger.info(`Format of file ${filepath} not supported`);
    }
  } else if (preset != null) {
    switch (preset) {
      case 'desktop':
        return desktopConfig;
      case 'perf':
        return perfConfig as Config;
      case 'experimental':
        return experimentalConfig as Config;
      default:
        // as preset is a string literal the default case here is normally caught by TS and not possible to happen. Now in reality it can happen and preset could be a string not included in the literal.
        // Therefore, we have to use `as string`. Otherwise, it will consider preset as type never
        ui().logger.info(`Preset "${preset as string}" is not supported`);
    }
  }
  return undefined;
}
