import ansis from 'ansis';
import type { Config, FormattedIcu } from 'lighthouse';
import log from 'lighthouse-logger';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import experimentalConfig from 'lighthouse/core/config/experimental-config.js';
import perfConfig from 'lighthouse/core/config/perf-config.js';
// @ts-ignore - lighthouse types not properly exported in v12
import type Details from 'lighthouse/types/lhr/audit-details';
// @ts-ignore - lighthouse types not properly exported in v12
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

export function filterAuditOutputs(
  auditOutputs: AuditOutputs,
  flags: LighthouseOptions = { skipAudits: [] },
): AuditOutputs {
  const toSkip = new Set(flags.skipAudits ?? []);
  return auditOutputs.filter(({ slug }) => !toSkip.has(slug));
}

export class LighthouseAuditParsingError extends Error {
  constructor(slug: string, error: unknown) {
    super(
      `Failed to parse ${ansis.bold(slug)} audit's details - ${stringifyError(error)}`,
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
  const { configPath, preset } = options;

  if (configPath != null) {
    // Resolve the config file path relative to where cli was called.
    return logger.task(
      `Loading lighthouse config from ${configPath}`,
      async () => {
        const message = `Loaded lighthouse config from ${configPath}`;
        if (configPath.endsWith('.json')) {
          return { message, result: await readJsonFile<Config>(configPath) };
        }
        if (/\.(ts|js|mjs)$/.test(configPath)) {
          return {
            message,
            result: await importModule<Config>({
              filepath: configPath,
              format: 'esm',
            }),
          };
        }
        throw new Error(
          `Unknown Lighthouse config file extension in ${configPath}`,
        );
      },
    );
  }

  if (preset != null) {
    const supportedPresets: Record<
      NonNullable<LighthouseCliFlags['preset']>,
      Config
    > = {
      desktop: desktopConfig,
      perf: perfConfig,
      experimental: experimentalConfig,
    };
    // in reality, the preset could be a string not included in the type definition
    const config: Config | undefined = supportedPresets[preset];
    if (config) {
      logger.info(`Loaded config from ${ansis.bold(preset)} preset`);
      return config;
    } else {
      logger.warn(`Preset "${preset}" is not supported`);
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
    const localPath = path.join(pluginWorkDir(LIGHTHOUSE_PLUGIN_SLUG), 'tmp');

    // eslint-disable-next-line functional/immutable-data
    process.env['TEMP'] = localPath;
    logger.debug(
      `Temporarily overwriting TEMP environment variable with ${localPath} to prevent permissions error on cleanup`,
    );

    try {
      return await fn();
    } finally {
      // eslint-disable-next-line functional/immutable-data
      process.env['TEMP'] = originalTmpDir;
      logger.debug(
        `Restored TEMP environment variable to original value ${originalTmpDir}`,
      );
    }
  };
}
