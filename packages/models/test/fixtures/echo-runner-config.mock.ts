import { platform } from 'os';
import { AuditOutput, RunnerConfig } from '../../src';

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
