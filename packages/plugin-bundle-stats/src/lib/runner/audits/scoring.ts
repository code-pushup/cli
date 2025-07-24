import type { Issue } from '@code-pushup/models';
import type { MinMax } from '../types.js';

export type BlacklistPatternList = readonly BlacklistEntry[];
export type BlacklistEntry =
  | string
  | {
      pattern: string;
      hint?: string;
    };

export type PenaltyConfig = {
  enabled?: boolean;
  artefactSize?: [number, number];
  warningWeight?: number;
  errorWeight?: number;
  /**
   * glob patterns when matching get penalised
   * e.g. packagenames outdates, should be lazy loaded, etc.
   * Can be simple strings or objects with pattern and optional hint
   */
  blacklist?: BlacklistPatternList;
};

export type ScoringConfig = {
  totalSize: MinMax;
  penalty?: false | PenaltyConfig;
};

export type ScoreCalculator = (value: number, issues: Issue[]) => number;

export const DEFAULT_PENALTY: PenaltyConfig = {
  warningWeight: 0.1,
  errorWeight: 0.2,
};

/**
 * Calculates normalized penalty score from issues using provided penalty options. Legacy function for backward compatibility.
 *
 * ## Penalty Parameters
 * - **E**: Count of issues of severity errors (🚨)
 * - **W**: Count of issues of severity warnings (⚠️)
 * - **we**: Weight per error issue (default 0.2)
 * - **ww**: Weight per warning issue (default 0.1)
 *
 * ## Default Penalty Options
 * When penalty options are not provided, these defaults are used:
 * - **errorWeight**: 0.2
 * - **warningWeight**: 0.1
 *
 * ## Issues Penalty Formula
 * ```
 * penalty = we × E + ww × W
 * normalizedPenalty = penalty / (we + ww)
 * ```
 *
 * @param issues - Array of diagnostic issues with severity levels
 * @param penalty - Penalty configuration with error and warning weights
 * @returns Normalized penalty score (0-1) based on issue counts and weights
 */
export function calculatePenalty(
  issues: Issue[],
  penalty?: PenaltyConfig,
): number {
  const errorWeight = penalty?.errorWeight ?? 0.2;
  const warningWeight = penalty?.warningWeight ?? 0.1;

  let errorCount = 0;
  let warningCount = 0;

  for (const issue of issues) {
    if (issue.severity === 'error') errorCount++;
    else if (issue.severity === 'warning') warningCount++;
  }

  const penaltyValue = errorWeight * errorCount + warningWeight * warningCount;
  const totalWeight = errorWeight + warningWeight;

  return totalWeight > 0 ? penaltyValue / totalWeight : 0;
}

/**
 * Creates a score calculator function configured with bundle settings. Applies direct penalty subtraction for intuitive scoring behavior with a maximum penalty cap of 20%.
 *
 * ## Scoring
 * Assigns a score in the range [0 … 1] to each artefact (or artefact selection) based on:
 * - Size vs. configurable minimum and maximum thresholds
 * - Direct penalty subtraction based on issue severity levels (when enabled)
 * - Penalty is capped at maximum 20% of the size score
 *
 * A perfect score (1) means "within acceptable range"; lower values indicate regressions.
 *
 * ## Size Parameters
 * - **S**: Actual bytes
 * - **Min**: Minimum threshold bytes (lower bound)
 * - **Max**: Maximum threshold bytes (upper bound)
 *
 * ## Size Score Formula
 * For single threshold (number):
 * ```
 * sizeScore = {
 *   1,  if S ≤ threshold
 *   0,  if S > threshold
 * }
 * ```
 *
 * For range thresholds [Min, Max]:
 * ```
 * sizeScore = {
 *   max(0, S/Min),  if S < Min (penalize under-sized bundles)
 *   1,              if Min ≤ S ≤ Max (perfect score)
 *   0,              if S > Max (too big = score 0)
 * }
 * ```
 *
 * ## Penalty Calculation
 * Direct subtraction approach with 20% maximum penalty cap:
 * ```
 * penaltyShift = errors × errorWeight + warnings × warningWeight
 * cappedPenalty = min(penaltyShift, sizeScore × 0.2)
 * ```
 * Default weights: errorWeight = 0.2, warningWeight = 0.1
 *
 * ## Final Score Calculation
 * ```
 * finalScore = max(0, sizeScore - cappedPenalty)
 * ```
 * This creates a penalty shift pattern where issues directly reduce the score by their weight values,
 * but the total penalty reduction is capped at 20% of the original size score.
 * Note: When `penalty` is `false`, only size score is used.
 *
 * @param options - Scoring configuration containing thresholds and penalty weights
 * @returns Score calculator function that takes (value, issues) and returns score [0-1]
 */
export function createBundleStatsScoring(
  options: ScoringConfig,
): ScoreCalculator {
  const { totalSize, penalty } = options;

  return (value: number, issues: Issue[] = []): number => {
    let sizeScore: number;

    if (Array.isArray(totalSize)) {
      // Range thresholds [min, max]
      const [minThreshold, maxThreshold] = totalSize;

      if (value < minThreshold) {
        sizeScore = Math.max(0, value / minThreshold);
      } else if (value <= maxThreshold) {
        sizeScore = 1.0;
      } else {
        sizeScore = 0;
      }
    } else {
      sizeScore = value <= totalSize ? 1.0 : 0;
    }

    if (penalty === false || issues.length === 0) {
      return sizeScore;
    }

    const penaltyOptions = penalty || DEFAULT_PENALTY;
    const penaltyShift = calculatePenaltyShift(issues, penaltyOptions);

    // Cap penalty at maximum 20% of the size score
    const maxPenalty = sizeScore * 0.2;
    const cappedPenalty = Math.min(penaltyShift, maxPenalty);

    return Math.max(0, sizeScore - cappedPenalty);
  };
}

/**
 * Calculates direct penalty shift based on issue counts and weights. Creates intuitive score reduction where each issue subtracts its weight from the final score.
 *
 * @param issues - Array of diagnostic issues with severity levels
 * @param options - Penalty configuration with error and warning weights
 * @returns Direct penalty shift value to subtract from size score
 */
function calculatePenaltyShift(
  issues: Issue[],
  options: PenaltyConfig,
): number {
  const errorCount = issues.filter(issue => issue.severity === 'error').length;
  const warningCount = issues.filter(
    issue => issue.severity === 'warning',
  ).length;

  const errorWeight = options.errorWeight ?? 0.2;
  const warningWeight = options.warningWeight ?? 0.1;

  // Direct penalty: each error/warning reduces score by its weight
  return errorCount * errorWeight + warningCount * warningWeight;
}
