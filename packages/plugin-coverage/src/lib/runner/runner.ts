import type { RunnerFunction } from '@code-pushup/models';
import { executeProcess } from '@code-pushup/utils';
import type { FinalCoveragePluginConfig } from '../config.js';
import { lcovResultsToAuditOutputs } from './lcov/lcov-runner.js';

export function createRunnerFunction(
  config: FinalCoveragePluginConfig,
): RunnerFunction {
  return async () => {
    const {
      reports,
      coverageToolCommand,
      continueOnCommandFail,
      coverageTypes,
    } = config;

    // Run coverage tool if provided
    if (coverageToolCommand != null) {
      const { command, args } = coverageToolCommand;
      try {
        await executeProcess({ command, args });
      } catch {
        if (!continueOnCommandFail) {
          throw new Error(
            'Coverage plugin: Running coverage tool failed. Make sure all your provided tests are passing.',
          );
        }
      }
    }

    // Calculate coverage from LCOV results
    return lcovResultsToAuditOutputs(reports, coverageTypes);
  };
}
