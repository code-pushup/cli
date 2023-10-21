import { AuditReport, RunnerConfig } from '../../src';

export function runnerConfig(
  audits: AuditReport[],
  outputFile = 'tmp/out.json',
): RunnerConfig {
  return {
    command: 'node',
    args: [
      '-e',
      `require('fs').writeFileSync('${outputFile}', '${JSON.stringify(
        audits,
      )}')`,
    ],
    outputFile,
  };
}
