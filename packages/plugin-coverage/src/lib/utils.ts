import type { AuditOutputs } from '@code-pushup/models';
import type { CoverageType } from './config.js';

export const coverageDescription: Record<CoverageType, string> = {
  branch:
    'Measures how many branches were executed after conditional statements in at least one test.',
  line: 'Measures how many lines of code were executed in at least one test.',
  function: 'Measures how many functions were called in at least one test.',
};

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

/* eslint-disable no-magic-numbers */
export const coverageTypeWeightMapper: Record<CoverageType, number> = {
  function: 6,
  branch: 3,
  line: 1,
};
/* eslint-enable no-magic-numbers */
