import type { AuditOutputs } from '@code-pushup/models';

/**
 * Since more code coverage does not necessarily mean better score, this optional override allows for defining custom coverage goals.
 * @param outputs original results
 * @param threshold threshold above which the score is to be 1
 * @returns Outputs with overriden score (not value) to 1 if it reached a defined threshold.
 */
export function applyMaxScoreAboveThreshold(
  outputs: AuditOutputs,
  threshold: number,
): AuditOutputs {
  return outputs.map(output =>
    output.score >= threshold ? { ...output, score: 1 } : output,
  );
}
