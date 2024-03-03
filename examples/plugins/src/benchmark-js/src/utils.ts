import { join } from 'node:path';
import { Audit, type AuditOutput, type CategoryRef } from '@code-pushup/models';
import { importEsmModule, slugify } from '@code-pushup/utils';
import { BenchmarkResult, SuitConfig } from './suit-helper';

/**
 * scoring of js computation time can be used in 2 ways:
 * - many implementations against the current implementation to maintain the fastest (score is 100 based on fastest)
 * - testing many implementations/libs to pick the fastest
 * @param results
 */
export function suitResultToAuditOutput(
  results: BenchmarkResult[],
): AuditOutput {
  const { hz: maxHz, suitName } = results.find(
    ({ isFastest }) => isFastest,
  ) as BenchmarkResult;
  const { hz } = results.find(({ isTarget }) => isTarget) as BenchmarkResult;

  return {
    slug: toAuditSlug(suitName),
    displayValue: `${hz.toFixed(1)} ops/sec`,
    score: hz / maxHz,
    value: Number.parseInt(hz.toString(), 10),
  };
}

export function toAuditSlug(suitName: string): string {
  return `${slugify(suitName)}-benchmark-js`;
}

export function toAuditTitle(suitName: string): string {
  return `${suitName} Benchmark JS`;
}

export function toAuditMetadata(suitNames: string[]): Audit[] {
  return suitNames.map(
    suitName =>
      ({
        slug: toAuditSlug(suitName),
        title: toAuditTitle(suitName),
      } satisfies Audit),
  );
}

export type LoadOptions = {
  tsconfig?: string;
};

export function loadSuits(
  targetFolders: string[],
  options: LoadOptions,
): Promise<SuitConfig[]> {
  const { tsconfig } = options;
  return Promise.all(
    targetFolders.map(
      (suitName: string) =>
        importEsmModule({
          tsconfig,
          filepath: join(suitName, 'index.ts'),
        }) as Promise<SuitConfig>,
    ),
  );
}

export function suitNameToCategoryRef(suitName: string): CategoryRef {
  return {
    type: 'audit',
    plugin: 'benchmark-js',
    slug: toAuditSlug(suitName),
    weight: 1,
  } satisfies CategoryRef;
}
