import { join } from 'path';
import {
  AuditOutputs,
  EsmRunnerConfig,
  RunnerConfig,
} from '@code-pushup/models';
import {
  Observer,
  ProcessObserver,
  calcDuration,
  executeProcess,
  readJsonFile,
} from '@code-pushup/utils';

export type RunnerResult = {
  date: string;
  duration: number;
  audits: AuditOutputs;
};

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

export async function executeEsmRunner(
  runner: EsmRunnerConfig,
  observer?: Observer,
): Promise<RunnerResult> {
  const date = new Date().toISOString();
  const start = performance.now();

  // execute plugin runner
  const audits = await runner(observer);

  // create runner result
  return {
    date,
    duration: calcDuration(start),
    audits,
  } satisfies RunnerResult;
}
