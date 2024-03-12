import {
  Audit,
  type AuditOutput,
  type CategoryRef,
  Issue,
} from '@code-pushup/models';
import {importEsmModule, slugify} from '@code-pushup/utils';

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
    score: targetHz <= maxHz ? targetHz / maxHz : 1,
    value: Number.parseInt(targetHz.toString(), 10),
    details: {
      issues: results.map(({ name, hz, rme, samples, isTarget, isFastest }) => {
        const targetIcon = isTarget ? '🎯' : '';
        const postfix = isFastest
          ? '(fastest 🔥)'
          : `(${((1 - hz / maxHz) * 100).toFixed(1)}% slower)`;
        return {
          // fast-glob x 40,824 ops/sec ±4.44% (85 runs sampled)
          message: `${targetIcon}${name} x ${hz.toFixed(
            2,
          )} ops/sec ±${rme.toFixed(2)}; ${samples} samples ${postfix}`,
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

export function suiteNameToCategoryRef(suiteName: string): CategoryRef {
  return {
    type: 'audit',
    plugin: 'benchmark-js',
    slug: toAuditSlug(suiteName),
    weight: 1,
  } satisfies CategoryRef;
}

export type SuiteConfig = {
  suiteName: string;
  targetImplementation: string;
  cases: [string, (...args: unknown[]) => Promise<unknown>][];
  time?: number;
};

export type BenchmarkResult = {
  hz: number;
  rme: number;
  samples: number;
  suiteName: string;
  name: string;
  isFastest: boolean;
  isTarget: boolean;
};

export type BenchmarkRunner = {
 run: (config: SuiteConfig, options: { verbose: false }) => Promise<BenchmarkResult[]>
};

export type LoadOptions = {
  tsconfig?: string;
};

export function loadSuites(
  targets: string[],
  options: LoadOptions = {},
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
