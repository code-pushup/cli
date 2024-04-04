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
import {
  LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS,
  UnsupportedCliFlags,
} from '../constants';
import type { LighthouseCliFlags } from './runner';

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
    } else {
      ui().logger.info(`Format of file ${filepath} not supported`);
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

export function validateFlags(
  flags: LighthouseCliFlags = {},
): LighthouseCliFlags {
  const unsupportedFlagsInUse = Object.keys(flags).filter(flag =>
    LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS.has(flag as UnsupportedCliFlags),
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
    Object.entries(flags).filter(
      ([flagName]) =>
        !LIGHTHOUSE_UNSUPPORTED_CLI_FLAGS.has(flagName as UnsupportedCliFlags),
    ),
  );
}
