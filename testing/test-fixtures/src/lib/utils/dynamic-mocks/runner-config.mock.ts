import { platform } from 'node:os';
import {
  type AuditOutput,
  type RunnerConfig,
  runnerConfigSchema,
} from '@code-pushup/models';

/**
 * Use this helper as a general purpose mock with working defaults
 * @param options
 */
export function runnerConfigMock(
  options?: Partial<RunnerConfig>,
): RunnerConfig {
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
export function echoRunnerConfigMock(
  output: AuditOutput[],
  outputFile: string,
): RunnerConfig {
  const auditOutput =
    platform() === 'win32'
      ? JSON.stringify(output)
      : `'${JSON.stringify(output)}'`;
  return {
    command: 'echo',
    args: [auditOutput, '>', outputFile],
    outputFile,
  };
}
