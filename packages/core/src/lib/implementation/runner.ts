import path from 'node:path';
import type { RunnerConfig, RunnerFunction } from '@code-pushup/models';
import {
  calcDuration,
  executeProcess,
  isVerbose,
  readJsonFile,
  removeDirectoryIfExists,
  ui,
} from '@code-pushup/utils';

export type RunnerResult = {
  date: string;
  duration: number;
  audits: unknown;
};

export async function executeRunnerConfig(
  cfg: RunnerConfig,
): Promise<RunnerResult> {
  const { args, command, outputFile, outputTransform } = cfg;

  // execute process
  const { duration, date } = await executeProcess({
    command,
    args,
    observer: {
      onStdout: stdout => {
        if (isVerbose()) {
          ui().logger.log(stdout);
        }
      },
      onStderr: stderr => ui().logger.error(stderr),
    },
  });

  // read process output from file system and parse it
  const outputs = await readJsonFile(outputFile);
  // clean up plugin individual runner output directory
  await removeDirectoryIfExists(path.dirname(outputFile));

  // transform unknownAuditOutputs to auditOutputs
  const audits = outputTransform ? await outputTransform(outputs) : outputs;

  // create runner result
  return {
    duration,
    date,
    audits,
  };
}

export async function executeRunnerFunction(
  runner: RunnerFunction,
): Promise<RunnerResult> {
  const date = new Date().toISOString();
  const start = performance.now();

  // execute plugin runner
  const audits = await runner();

  // create runner result
  return {
    date,
    duration: calcDuration(start),
    audits,
  };
}
