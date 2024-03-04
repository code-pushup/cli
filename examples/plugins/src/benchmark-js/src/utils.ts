import {Audit, AuditDetails, type AuditOutput, type CategoryRef, Issue} from '@code-pushup/models';
import {importEsmModule, slugify} from '@code-pushup/utils';
import {BenchmarkResult, SuiteConfig} from './suite-helper';

/**
 * scoring of js computation time can be used in 2 ways:
 * - many implementations against the current implementation to maintain the fastest (score is 100 based on fastest)
 * - testing many implementations/libs to pick the fastest
 * @param results
 */
export function suiteResultToAuditOutput(
  results: BenchmarkResult[]
): AuditOutput {
  const {hz: maxHz, suiteName} = results.find(
    ({isFastest}) => isFastest,
  ) as BenchmarkResult;
  const {hz, name: targetCaseName} = results.find(({isTarget}) => isTarget) as BenchmarkResult;

  const audit = {
    slug: toAuditSlug(suiteName),
    displayValue: `${hz.toFixed(1)} ops/sec`,
    score: hz / maxHz,
    value: Number.parseInt(hz.toString(), 10)
  };
  const details= toAuditDetails(results, targetCaseName, maxHz);
  if(details) {
    return {
      ...audit,
      ...details
    }
  }
  return audit;
}


export function toAuditDetails(results: BenchmarkResult[], targetCaseName: string, maxHz: number): { details: AuditDetails } {
  return {
    details: {
      issues: results.map(({name, hz}) => {
        const targetIcon = name === targetCaseName ? '🎯' : '';
        const fastestIcon = name === targetCaseName ? '🔥' : '';
        const postfix = hz < maxHz ? `(${maxHz - hz}hz slower)` : '';
        return {
          message: `${targetIcon}${name} ${fastestIcon}${hz} ops/sec ${postfix}`,
          severity: 'info'
        } satisfies Issue
      })
    }
  }
}

export function toAuditSlug(suiteName: string): string {
  return `${slugify(suiteName)}-benchmark-js`;
}

export function toAuditTitle(suiteName: string): string {
  return `${suiteName} Benchmark JS`;
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
  const {tsconfig} = options;
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
