import {type AuditOutput, type CategoryRef} from '@code-pushup/models';
import {slugify} from '@code-pushup/utils';

export function toAuditSlug(suitName: string, caseName: string): string {
  return `${slugify(suitName)}-benchmark-${slugify(caseName)}`;
}

export function suitNameToCategoryRef(suitName: string): CategoryRef {
  return ({
    type: 'group',
    plugin: 'benchmark-js',
    slug: `${suitName}-benchmark-js`,
    weight: 1,
  } satisfies CategoryRef)
}

export type BenchmarkJSRunnerOptions = {
  tsconfig?: string;
  outputDir?: string;
  targetFolder?: string;
};

/**
 * scoring of js computation time can be used in 2 ways:
 * - many implementations against the current implementation to maintain the fastest (score is 100 based on fastest)
 * - testing many implementations/libs to pick the fastest
 * @param result
 */
export function scoredAuditOutput(result: BenchmarkResult, maxHz: number ): AuditOutput {
  const {suitName, name, hz} = result;
  return {
    slug: toAuditSlug(suitName, name),
    displayValue: `${hz.toFixed(3)} ops/sec`,
    score: hz / maxHz,
    value: parseInt(hz.toString(), 10),
  };
}


export type BenchmarkResult = {
  suitName: string;
  name: string;
  hz: number; // operations per second
  rme: number; // relative margin of error
  samples: number;
  isFastest: boolean;
  isTarget: boolean;
};
/*
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
      .concat(outputDir ? [`--outputDir=${outputDir}`] : []),
    outputFile: join(outputDir, `${suit}-benchmark-results.json`),
    outputTransform: (raw: unknown): AuditOutputs => {
      const benchmarkResult = raw as BenchmarkResult[];
      const {
        suitName = '',
        name = '',
        hz = 0,
      } = benchmarkResult.find(({ isFastest }) => isFastest) ?? {};
      return [
        {
          slug: `${slugify(String(suitName))}-benchmark-js`,
          displayValue: `${Math.round(hz)} ops/sec`,
          score: name === 'current-implementation' ? 1 : 0,
          value: Math.round(hz),
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
*/
