import type { RunnerResult } from 'lighthouse';
import { runLighthouse } from 'lighthouse/cli/run.js';
import { dirname } from 'node:path';
import { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import { ensureDirectoryExists } from '@code-pushup/utils';
import { DEFAULT_CLI_FLAGS } from './constants';
import { LighthouseCliFlags } from './types';
import {
  determineAndSetLogLevel,
  getConfig,
  normalizeAuditOutputs,
  toAuditOutputs,
} from './utils';

export function createRunnerFunction(
  urlUnderTest: string,
  flags: LighthouseCliFlags = DEFAULT_CLI_FLAGS,
): RunnerFunction {
  return async (): Promise<AuditOutputs> => {
    const {
      configPath,
      preset,
      outputPath,
      ...parsedFlags
    }: Partial<LighthouseCliFlags> = flags;

    const logLevel = determineAndSetLogLevel(parsedFlags);

    const config = await getConfig({ configPath, preset });
    if (outputPath) {
      await ensureDirectoryExists(dirname(outputPath));
    }

    const enrichedFlags = {
      ...parsedFlags,
      logLevel,
      outputPath,
    };

    const runnerResult: unknown = await runLighthouse(
      urlUnderTest,
      enrichedFlags,
      config,
    );

    if (runnerResult == null) {
      throw new Error('Lighthouse did not produce a result.');
    }

    const { lhr } = runnerResult as RunnerResult;
    const auditOutputs = toAuditOutputs(Object.values(lhr.audits), flags);

    return normalizeAuditOutputs(auditOutputs, enrichedFlags);
  };
}
