import {auditOutputsSchema, RunnerConfig, RunnerResult} from "@code-pushup/models";
import {executeProcess} from "@code-pushup/utils";
import {readFile} from "fs/promises";
import {join} from "path";

export async function executeRunner(cfg: RunnerConfig): Promise<RunnerResult> {
  const {args, command, outputFile} = cfg;

  const {duration, date} = await executeProcess({
    command,
    args,
  });

  const processOutputPath = join(
    process.cwd(),
    outputFile,
  );

  // read process output from file system and parse it
  const audits = auditOutputsSchema.parse(
    JSON.parse((await readFile(processOutputPath)).toString()),
  );

  return {
    duration,
    date,
    audits
  } satisfies RunnerResult;
}
