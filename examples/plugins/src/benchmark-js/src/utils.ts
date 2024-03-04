import {
  Audit,
  type AuditOutput,
  type CategoryRef,
  Issue,
} from '@code-pushup/models';
import { importEsmModule, slugify } from '@code-pushup/utils';
import { BenchmarkResult, SuiteConfig } from './suite-helper';

/**
 * scoring of js computation time can be used in 2 ways:
 * - many implementations against the current implementation to maintain the fastest (score is 100 based on fastest)
 * - testing many implementations/libs to pick the fastest
 * @param results
 */
export function suiteResultToAuditOutput(
  results: BenchmarkResult[],
): AuditOutput {
  const { hz: maxHz, suiteName } = results.find(
    ({ isFastest }) => isFastest,
  ) as BenchmarkResult;
  const { hz: targetHz } = results.find(
    ({ isTarget }) => isTarget,
  ) as BenchmarkResult;

  return {
    slug: toAuditSlug(suiteName),
    displayValue: `${targetHz.toFixed(2)} ops/sec`,
    score: targetHz / maxHz,
    value: Number.parseInt(targetHz.toString(), 10),
    details: {
      issues: results.map(({ name, hz, isTarget, isFastest }) => {
        const targetIcon = isTarget ? '🎯' : '';
        const postfix = isFastest
          ? '(fastest 🔥)'
          : `(${((1 - hz / maxHz) * 100).toFixed(1)}% slower)`;
        return {
          message: `${targetIcon}${name} ${hz.toFixed(2)} ops/sec ${postfix}`,
          severity: hz < maxHz && isTarget ? 'error' : 'info',
        } satisfies Issue;
      }),
    },
  };
}

export function toAuditSlug(suiteName: string): string {
  return `benchmark-js-${slugify(suiteName)}`;
}

export function toAuditTitle(suiteName: string): string {
  return `${suiteName}`;
}

export function toAuditMetadata(suiteNames: string[]): Audit[] {
  return suiteNames.map(
    suiteName =>
      ({
        slug: toAuditSlug(suiteName),
        title: toAuditTitle(suiteName),
      } satisfies Audit),
  );
}

export type LoadOptions = {
  tsconfig?: string;
};

export function loadSuits(
  targets: string[],
  options: LoadOptions,
): Promise<SuiteConfig[]> {
  const { tsconfig } = options;
  return Promise.all(
    targets.map(
      (filepath: string) =>
        importEsmModule({
          tsconfig,
          filepath,
        }) as Promise<SuiteConfig>,
    ),
  );
}

export function suiteNameToCategoryRef(suiteName: string): CategoryRef {
  return {
    type: 'audit',
    plugin: 'benchmark-js',
    slug: toAuditSlug(suiteName),
    weight: 1,
  } satisfies CategoryRef;
}
