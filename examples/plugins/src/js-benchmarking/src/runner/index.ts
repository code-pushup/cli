import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AuditOutputs, RunnerFunction } from '@code-pushup/models';
import { importEsmModule } from '@code-pushup/utils';
import { BenchmarkResult, BenchmarkRunner, SuiteConfig } from './types';
import { suiteResultToAuditOutput } from './utils';

export function createRunnerFunction(
  suites: SuiteConfig[],
  options: {
    runnerPath: string;
    outputDir?: string;
  },
): RunnerFunction {
  const { outputDir, runnerPath } = options;
  return async (): Promise<AuditOutputs> => {
    const allSuiteResults: BenchmarkResult[][] = [];
    // Execute each suite sequentially
    // eslint-disable-next-line functional/no-loop-statements
    for (const suite of suites) {
      const runner = (await importEsmModule({
        filepath: runnerPath,
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
