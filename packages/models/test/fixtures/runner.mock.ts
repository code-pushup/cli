import { AuditReport, RunnerConfig } from '../../src';
import {join} from "node:path";

export function runnerConfig(
  audits: AuditReport[],
  outputFile = join('tmp',`out.${Date.now()}.json`),
): RunnerConfig {
  return {
    command: 'node',
    args: [
      'echo',
      `require('fs').writeFileSync('${outputFile}', '${JSON.stringify(
        audits,
      )}')`,
    ],
    outputFile,
  };
}
