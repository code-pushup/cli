import { AuditOutput, RunnerConfig } from '@code-pushup/models';
import { toUnixPath } from './utils';

export function createFileWriteRunnerConfig(
  output: AuditOutput[],
  outputFilePath: string,
): RunnerConfig {
  return {
    command: 'echo',
    args: ['"' + JSON.stringify(output) + '"', '>', toUnixPath(outputFilePath)],
    outputFile: toUnixPath(outputFilePath),
  };
}
