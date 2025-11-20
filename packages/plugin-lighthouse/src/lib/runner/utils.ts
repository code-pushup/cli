import ansis from 'ansis';
import type { Config, FormattedIcu } from 'lighthouse';
import log from 'lighthouse-logger';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import experimentalConfig from 'lighthouse/core/config/experimental-config.js';
import perfConfig from 'lighthouse/core/config/perf-config.js';
import type Details from 'lighthouse/types/lhr/audit-details';
import type { Result } from 'lighthouse/types/lhr/audit-result';
import os from 'node:os';
import path from 'node:path';
import type { AuditOutput, AuditOutputs } from '@code-pushup/models';
import {
  formatReportScore,
  importModule,
  logger,
  pluginWorkDir,
  readJsonFile,
  stringifyError,
} from '@code-pushup/utils';
import { LIGHTHOUSE_PLUGIN_SLUG } from '../constants.js';
import type { LighthouseOptions } from '../types.js';
import { logUnsupportedDetails, toAuditDetails } from './details/details.js';
import type { LighthouseCliFlags } from './types.js';

export function normalizeAuditOutputs(
  auditOutputs: AuditOutputs,
  flags: LighthouseOptions = { skipAudits: [] },
): AuditOutputs {
  const toSkip = new Set(flags.skipAudits ?? []);
  return auditOutputs.filter(({ slug }) => !toSkip.has(slug));
}

export class LighthouseAuditParsingError extends Error {
  constructor(slug: string, error: unknown) {
    super(
      `\nAudit ${ansis.bold(slug)} failed parsing details: \n${stringifyError(error)}`,
    );
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
    throw new LighthouseAuditParsingError(auditOutput.slug, error);
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
      logger.warn(`Format of file ${filepath} not supported`);
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
        logger.warn(`Preset "${preset as string}" is not supported`);
    }
  }
  return undefined;
}

export function enrichFlags(
  flags: LighthouseCliFlags,
  urlIndex?: number,
): LighthouseOptions {
  const { outputPath, ...parsedFlags }: Partial<LighthouseCliFlags> = flags;

  const logLevel = determineAndSetLogLevel(parsedFlags);

  const urlSpecificOutputPath =
    urlIndex && outputPath
      ? outputPath.replace(/(\.[^.]+)?$/, `-${urlIndex}$1`)
      : outputPath;

  return {
    ...parsedFlags,
    logLevel,
    outputPath: urlSpecificOutputPath,
  };
}

/**
 * Wraps Lighthouse runner with `TEMP` directory override for Windows, to prevent permissions error on cleanup.
 *
 * `Runtime error encountered: EPERM, Permission denied: \\?\C:\Users\RUNNER~1\AppData\Local\Temp\lighthouse.57724617 '\\?\C:\Users\RUNNER~1\AppData\Local\Temp\lighthouse.57724617'`
 *
 * @param fn Async function which runs Lighthouse.
 * @returns Wrapped function which overrides `TEMP` environment variable, before cleaning up afterwards.
 */
export function withLocalTmpDir<T>(fn: () => Promise<T>): () => Promise<T> {
  if (os.platform() !== 'win32') {
    return fn;
  }

  return async () => {
    const originalTmpDir = process.env['TEMP'];
    // eslint-disable-next-line functional/immutable-data
    process.env['TEMP'] = path.join(
      pluginWorkDir(LIGHTHOUSE_PLUGIN_SLUG),
      'tmp',
    );

    try {
      return await fn();
    } finally {
      // eslint-disable-next-line functional/immutable-data
      process.env['TEMP'] = originalTmpDir;
    }
  };
}
