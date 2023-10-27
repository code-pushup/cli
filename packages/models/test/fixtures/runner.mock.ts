import { join } from 'node:path';
import { AuditReport, RunnerConfig } from '../../src';

export function runnerConfig(
  audits: AuditReport[],
  outputFile = join('tmp', `out.${Date.now()}.json`),
): RunnerConfig {
  return {
    command: 'node',
    args: ['echo', `${JSON.stringify(audits)} > ${outputFile}`],
    outputFile,
  };
}
