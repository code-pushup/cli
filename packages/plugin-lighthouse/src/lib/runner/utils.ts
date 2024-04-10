import chalk from 'chalk';
import type { Budget, Config } from 'lighthouse';
import log from 'lighthouse-logger';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import experimentalConfig from 'lighthouse/core/config/experimental-config.js';
import perfConfig from 'lighthouse/core/config/perf-config.js';
import { Result } from 'lighthouse/types/lhr/audit-result';
import path from 'node:path';
import { AuditOutput, AuditOutputs } from '@code-pushup/models';
import { importEsmModule, readJsonFile, ui } from '@code-pushup/utils';
import type { LighthouseOptions } from '../types';
import { PLUGIN_SLUG } from './constants';
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
        `Audit ${chalk.bold(
          slug,
        )} was included in audit outputs of lighthouse but listed under ${chalk.bold(
          'skipAudits',
        )}.`,
      );
    }
    return !doSkip;
  });
}

export function toAuditOutputs(
  lhrAudits: Result[],
  { verbose = false }: { verbose?: boolean } = {},
): AuditOutputs {
  if (verbose) {
    // @TODO implement all details
    logUnsupportedDetails(lhrAudits);
  }
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
        // @TODO implement details
        return auditOutput;
      }

      return auditOutput;
    },
  );
}

export const unsupportedDetailTypes = new Set([
  'opportunity',
  'table',
  'treemap-data',
  'screenshot',
  'filmstrip',
  'debugdata',
  'criticalrequestchain',
]);

export function logUnsupportedDetails(
  lhrAudits: Result[],
  { displayCount = 3 }: { displayCount?: number } = {},
) {
  const slugsWithDetailParsingErrors = [
    ...new Set(
      lhrAudits
        .filter(({ details }) =>
          unsupportedDetailTypes.has(details?.type as string),
        )
        .map(({ details }) => details?.type),
    ),
  ];
  if (slugsWithDetailParsingErrors.length > 0) {
    const postFix = (count: number) =>
      count > displayCount ? ` and ${count - displayCount} more.` : '';
    ui().logger.debug(
      `${chalk.yellow('⚠')} Plugin ${chalk.bold(
        PLUGIN_SLUG,
      )} skipped parsing of unsupported audit details: ${chalk.bold(
        slugsWithDetailParsingErrors.slice(0, displayCount).join(', '),
      )}${postFix(slugsWithDetailParsingErrors.length)}`,
    );
  }
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

export type ConfigOptions = Partial<
  Pick<LighthouseCliFlags, 'configPath' | 'preset'>
>;

export async function getConfig(
  options: ConfigOptions = {},
): Promise<Config | undefined> {
  const { configPath: filepath, preset } = options;

  if (typeof filepath === 'string') {
    if (filepath.endsWith('.json')) {
      // Resolve the config file path relative to where cli was called.
      return readJsonFile<Config>(filepath);
    } else if (/\.(ts|js|mjs)$/.test(filepath)) {
      return importEsmModule<Config>({ filepath });
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
        // Therefore we have to use `as string` is used. Otherwise, it will consider preset as type never
        ui().logger.info(`Preset "${preset as string}" is not supported`);
    }
  }
  return undefined;
}

export async function getBudgets(budgetPath?: string): Promise<Budget[]> {
  if (budgetPath) {
    /** @type {Array<LH.Budget>} */
    return await readJsonFile<Budget[]>(
      path.resolve(process.cwd(), budgetPath),
    );
  }
  return [] as Budget[];
}
