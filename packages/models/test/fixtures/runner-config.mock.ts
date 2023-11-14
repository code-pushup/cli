import { platform } from 'os';
import { RunnerConfig } from '../../src';
import {
  RunnerFunction,
  runnerConfigSchema,
  runnerFunctionSchema,
} from '../../src/lib/plugin-config-runner';
import { AuditOutput, AuditOutputs } from '../../src/lib/plugin-process-output';

/**
 * Use this helper as a general purpose mock with working defaults
 * @param options
 */
export function runnerConfig(options?: Partial<RunnerConfig>): RunnerConfig {
  const outputFile = `out.${Date.now()}.json`;
  return runnerConfigSchema.parse({
    command: 'node',
    args: ['-v', '>', outputFile],
    outputFile,
    ...options,
  });
}

/**
 * Use this helper to mock the output data of a plugin synchronously
 *
 * @param output
 * @param outputFile
 */
export function echoRunnerConfig(
  output: AuditOutput[],
  outputFile: string,
): RunnerConfig {
  const auditOutput =
    platform() === 'win32'
      ? JSON.stringify(output)
      : "'" + JSON.stringify(output) + "'";
  return {
    command: 'echo',
    args: [auditOutput, '>', outputFile],
    outputFile,
  };
}
