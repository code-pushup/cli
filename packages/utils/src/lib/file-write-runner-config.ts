import { platform } from 'os';
import { AuditOutput, RunnerConfig } from '@code-pushup/models';
import { toUnixPath } from './utils';

export function createFileWriteRunnerConfig(
  output: AuditOutput[],
  outputFilePath: string,
): RunnerConfig {
  const auditOutput =
    platform() === 'win32'
      ? JSON.stringify(output)
      : "'" + JSON.stringify(output) + "'";
  return {
    command: 'echo',
    args: [auditOutput, '>', toUnixPath(outputFilePath)],
    outputFile: toUnixPath(outputFilePath),
  };
}
