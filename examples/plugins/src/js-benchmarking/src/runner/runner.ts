import {BenchmarkResult, BenchmarkRunner, SuiteConfig} from "./types";
import {AuditOutputs, RunnerFunction} from "@code-pushup/models";
import {importEsmModule} from "@code-pushup/utils";
import {writeFile} from "node:fs/promises";
import {join} from "node:path";
import {suiteResultToAuditOutput} from "./utils";
import {JS_BENCHMARKING_PLUGIN_SLUG} from "../constants";

export function createRunnerFunction(
  suites: SuiteConfig[],
  options: {
    runnerPath: string;
    outputDir?: string;
  },
): RunnerFunction {
  const { outputDir = join('.code-pushup', JS_BENCHMARKING_PLUGIN_SLUG), runnerPath: filepath } = options;
  return async (): Promise<AuditOutputs> => {
    const allSuiteResults: BenchmarkResult[][] = [];
    // Execute each suite sequentially
    // eslint-disable-next-line functional/no-loop-statements
    for (const suite of suites) {
      const runner = (await importEsmModule({
        filepath,
      })) as BenchmarkRunner;
      const result: BenchmarkResult[] = await runner.run(suite);
      if (outputDir && outputDir !== '') {
        await writeFile(
          join(outputDir, `${suite.suiteName}-benchmark.json`),
          JSON.stringify(result, null, 2),
        );
      }
      // eslint-disable-next-line functional/immutable-data
      allSuiteResults.push(result);
    }

    // create audit output
    return allSuiteResults.map(results => suiteResultToAuditOutput(results));
  };
}
