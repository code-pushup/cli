import { join } from 'path';
import {
  AuditOutputs,
  OnProgress,
  RunnerConfig,
  RunnerFunction,
} from '@code-pushup/models';
import { calcDuration, executeProcess, readJsonFile } from '@code-pushup/utils';

export type RunnerResult = {
  date: string;
  duration: number;
  audits: AuditOutputs;
};

export async function executeRunnerConfig(
  cfg: RunnerConfig,
  onProgress?: OnProgress,
): Promise<RunnerResult> {
  const { args, command, outputFile, outputTransform } = cfg;

  // execute process
  const { duration, date } = await executeProcess({
    command,
    args,
    observer: { onStdout: onProgress },
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

export async function executeRunnerFunction(
  runner: RunnerFunction,
  onProgress?: OnProgress,
): Promise<RunnerResult> {
  const date = new Date().toISOString();
  const start = performance.now();

  // execute plugin runner
  const audits = await runner(onProgress);

  // create runner result
  return {
    date,
    duration: calcDuration(start),
    audits,
  };
}
