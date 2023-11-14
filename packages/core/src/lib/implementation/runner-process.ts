import { join } from 'path';
import { AuditOutputs, RunnerConfig } from '@code-pushup/models';
import {
  ProcessObserver,
  executeProcess,
  readJsonFile,
} from '@code-pushup/utils';
import { RunnerResult } from './runner';

export async function executeProcessRunner(
  cfg: RunnerConfig,
  observer?: ProcessObserver,
): Promise<RunnerResult> {
  const { args, command, outputFile, outputTransform } = cfg;

  // execute process
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
  if (outputTransform) {
    audits = await outputTransform(audits);
  }

  // create runner result
  return {
    duration,
    date,
    audits,
  };
}
