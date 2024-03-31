import {BenchmarkResult} from "./types";
import {AuditOutput, Issue} from "@code-pushup/models";
import {JS_BENCHMARKING_PLUGIN_SLUG} from "../constants";
import {slugify} from "@code-pushup/utils";

export function toAuditSlug(suiteName: string): string {
  return `${JS_BENCHMARKING_PLUGIN_SLUG}-${slugify(suiteName)}`;
}

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
