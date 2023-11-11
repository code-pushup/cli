import { join } from 'path';
import {
  AuditOutputs,
  RunnerConfig,
  RunnerResult,
  runnerResultSchema,
} from '@code-pushup/models';
import {
  ProcessObserver,
  executeProcess,
  readJsonFile,
} from '@code-pushup/utils';

export async function executeRunner(
  cfg: RunnerConfig,
  observer?: ProcessObserver,
): Promise<RunnerResult> {
  const { args, command, outputFile, outputFileToAuditResults } = cfg;

  const { duration, date } = await executeProcess({
    command,
    args,
    observer,
  });

  // read process output from file system and parse it
  let audits = await readJsonFile<AuditOutputs>(
    join(process.cwd(), outputFile),
  );

  // transform unknownAuditOutputs to auditOutputs
  if (outputFileToAuditResults) {
    audits = outputFileToAuditResults(audits) as RunnerResult['audits'];
  }

  return runnerResultSchema.parse({
    duration,
    date,
    audits,
  });
}
