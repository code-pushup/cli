import { join } from 'node:path';
import { AuditOutput, AuditOutputs, RunnerConfig } from '@code-pushup/models';
import { executeProcess, readJsonFile, slugify } from '@code-pushup/utils';

export function isFullfilled<T>(
  p: PromiseSettledResult<T>,
): p is PromiseFulfilledResult<T> {
  return p.status === 'fulfilled';
}

export function toAuditSlug(suitName: string, caseName: string): string {
  return `${slugify(suitName)}-benchmark-${slugify(caseName)}`;
}
export function toAuditTitle(suitName: string, caseName: string): string {
  return `Benchmark ${suitName} - ${caseName}`;
}

export type BenchmarkJSRunnerOptions = {
  tsconfig?: string;
  outputDir?: string;
  targetFolder?: string;
};

export type BenchmarkResult = {
  suitName: string;
  name: string;
  hz: number; // operations per second
  rme: number; // relative margin of error
  samples: number;
  isFastest: number;
};

export function toBenchmarkJSRunnerConfig(
  suit: string,
  {
    outputDir = '.',
    targetFolder = '.',
    tsconfig,
  }: BenchmarkJSRunnerOptions = {},
): RunnerConfig {
  return {
    command: 'npx',
    args: ['tsx', join(targetFolder, suit)]
      // concat is used to avoid branching boilerplate
      .concat(tsconfig ? [`--tsconfig=${tsconfig}`] : [])
      .concat(outputDir ? [`--tsconfig=${outputDir}`] : []),
    outputFile: join(outputDir, `${suit}-benchmark-results.json`),
    outputTransform: (raw: unknown): AuditOutputs => {
      const benchmarkResult = raw as BenchmarkResult[];
      const {
        suitName = '',
        name = '',
        hz = 0,
      } = benchmarkResult.find(({ isFastest }) => isFastest === 1) ?? {};
      return [
        {
          slug: `${slugify(String(suitName))}-benchmark-js`,
          displayValue: `${Math.round(hz)} ops/sec`,
          score: name === 'current-implementation' ? 1 : 0,
          value: Math.round(hz),
          details: {
            issues: benchmarkResult.map(
              ({ name = '', hz = 0, rme = 0, samples = 0, isFastest }) => ({
                message: `${name} x ${hz} ops/sec ${rme} (${samples} runs sampled)`,
                severity:
                  isFastest === 1 && name === 'current-implementation'
                    ? 'info'
                    : 'warning',
              }),
            ),
          },
        } satisfies AuditOutput,
      ];
    },
  } satisfies RunnerConfig;
}

export async function executeRunnerConfig(
  cfg: RunnerConfig,
): Promise<AuditOutputs> {
  const { args, command, outputFile, outputTransform } = cfg;

  // execute process
  console.log('executeProcess: ', command, args?.join(' '));
  await executeProcess({ command, args });

  // read process output from file system and parse it
  const outputs = await readJsonFile(join(process.cwd(), outputFile));

  // transform unknownAuditOutputs to auditOutputs
  return outputTransform
    ? await outputTransform(outputs)
    : (outputs as AuditOutputs);
}
