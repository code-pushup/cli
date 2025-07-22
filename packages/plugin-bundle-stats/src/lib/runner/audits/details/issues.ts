import { minimatch } from 'minimatch';
import type { Issue } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { BundleStatsConfig } from '../../types.js';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
} from '../../unify/unified-stats.types.js';

// ===== ISSUE ICONS =====

export const ISSUE_ICONS = {
  TOO_LARGE: '🔺',
  TOO_SMALL: '🔻',
  BLACKLIST: '🚫',
} as const;

export type PenaltyConfig = {
  artefactSize?: [number, number];
  warningWeight?: number;
  errorWeight?: number;
  blacklist?: string[];
};

/**
 * Checks if a path matches any of the given blacklist patterns. Enables pattern-based filtering for bundle security and optimization.
 */
function matchesBlacklistPattern(
  path: string,
  patterns: string[],
): string | null {
  for (const pattern of patterns) {
    if (minimatch(path, pattern, { matchBase: true })) {
      return pattern;
    }
  }
  return null;
}

/**
 * Creates error issue for oversized artifact exceeding maximum threshold. Indicates unoptimized bundle or accidental check-in requiring optimization.
 *
 * @param outputPath - Path to the output file that exceeds size limit
 * @param bytes - Actual size of the artifact in bytes
 * @param maxSize - Maximum allowed size threshold in bytes
 * @returns Issue object with error severity and optimization recommendation
 *
 * @example
 * ```js
 * createTooLargeIssue('dist/bundle.js', 1048576, 500000)
 * // Returns: { message: "🔺 `dist/bundle.js` is **1 MB** _(> 488 kB)_", severity: 'error', ... }
 * ```
 */
export function createTooLargeIssue(
  outputPath: string,
  bytes: number,
  maxSize: number,
): Issue {
  return {
    message: `${ISSUE_ICONS.TOO_LARGE} \`${outputPath}\` is **${formatBytes(bytes)}** _(> ${formatBytes(maxSize)})_`,
    severity: 'error',
    source: { file: outputPath },
  };
}

/**
 * Creates warning issue for undersized artifact below minimum threshold. Signals missing dependencies or incomplete build requiring verification.
 *
 * @param outputPath - Path to the output file that is below size limit
 * @param bytes - Actual size of the artifact in bytes
 * @param minSize - Minimum expected size threshold in bytes
 * @returns Issue object with warning severity and verification recommendation
 *
 * @example
 * ```js
 * createTooSmallIssue('dist/chunk.js', 512, 2048)
 * // Returns: { message: "🔻 `dist/chunk.js` is **512 B** _(< 2 kB)_", severity: 'warning', ... }
 * ```
 */
export function createTooSmallIssue(
  outputPath: string,
  bytes: number,
  minSize: number,
): Issue {
  return {
    message: `${ISSUE_ICONS.TOO_SMALL} \`${outputPath}\` is **${formatBytes(bytes)}** _(< ${formatBytes(minSize)})_`,
    severity: 'warning',
    source: { file: outputPath },
  };
}

/**
 * Creates error issue for blacklisted import pattern match. Enforces dependency restrictions for security and architectural compliance.
 *
 * @param importPath - Path that matched the blacklist pattern
 * @param outputPath - Output file containing the blacklisted import
 * @param pattern - Specific pattern that was matched
 * @returns Issue object with error severity and compliance requirement
 *
 * @example
 * ```js
 * createBlacklistedIssue('src/math.ts', 'bundle.js', '**\/math.*')
 * // Returns: { message: "🚫 `src/math.ts` matches blacklist pattern `**\/math.*`", severity: 'error', ... }
 * ```
 */
export function createBlacklistedIssue(
  importPath: string,
  outputPath: string,
  pattern: string,
): Issue {
  return {
    message: `${ISSUE_ICONS.BLACKLIST} \`${importPath}\` matches blacklist pattern \`${pattern}\``,
    severity: 'error',
    source: { file: outputPath },
  };
}

/**
 * Validates artifact size against configured thresholds and returns appropriate issues. Ensures bundles stay within acceptable size ranges.
 *
 * @param outputPath - Path to the output file being checked
 * @param output - Output metadata containing size information
 * @param minSize - Minimum expected size threshold in bytes (optional)
 * @param maxSize - Maximum allowed size threshold in bytes (optional)
 * @returns Array of size-related issues found
 */
export function checkSizeIssues(
  outputPath: string,
  output: UnifiedStatsBundle,
  minSize?: number,
  maxSize?: number,
): Issue[] {
  const outputBytes = output.bytes;

  if (maxSize !== undefined && outputBytes > maxSize) {
    return [createTooLargeIssue(outputPath, outputBytes, maxSize)];
  } else if (minSize !== undefined && outputBytes < minSize) {
    return [createTooSmallIssue(outputPath, outputBytes, minSize)];
  }

  return [];
}

/**
 * Scans artifact inputs and imports for blacklisted patterns and returns violation issues.
 * Enforces dependency restrictions across bundle contents.
 *
 * Searches for blacklisted paths in these locations:
 * 1. Primary File Path Locations:
 *    - Object keys in the inputs section
 *    - "path" properties in imports
 *    - "original" properties in imports (exact import statements as written in source code)
 * 2. Entry Point Locations:
 *    - "entryPoint" properties in chunk/output definitions
 * 3. Output File Locations:
 *    - Output file paths (as object keys)
 * 4. Special Path Patterns:
 *    - Disabled paths with "(disabled):" prefix
 *    - Runtime paths with "<runtime>" pattern
 *
 * @param outputPath - Path to the output file being scanned
 * @param output - Output metadata containing inputs and imports
 * @param blacklistPatterns - Array of glob patterns to match against
 * @returns Array of blacklist-related issues found
 */
export function checkBlacklistIssues(
  outputPath: string,
  output: UnifiedStatsBundle,
  blacklistPatterns: string[],
): Issue[] {
  const issues: Issue[] = [];

  // 1. Check output path itself (object key in outputs section)
  const outputPathMatch = matchesBlacklistPattern(
    outputPath,
    blacklistPatterns,
  );
  if (outputPathMatch) {
    issues.push(
      createBlacklistedIssue(outputPath, outputPath, outputPathMatch),
    );
  }

  // 2. Check entryPoint property
  if (output.entryPoint) {
    const entryPointMatch = matchesBlacklistPattern(
      output.entryPoint,
      blacklistPatterns,
    );
    if (entryPointMatch) {
      issues.push(
        createBlacklistedIssue(output.entryPoint, outputPath, entryPointMatch),
      );
    }
  }

  // 3. Check input paths (object keys in inputs section)
  if (output.inputs) {
    for (const inputPath in output.inputs) {
      const matchedPattern = matchesBlacklistPattern(
        inputPath,
        blacklistPatterns,
      );
      if (matchedPattern) {
        issues.push(
          createBlacklistedIssue(inputPath, outputPath, matchedPattern),
        );
      }
    }
  }

  // 4. Check import paths and original import statements
  if (output.imports) {
    for (let i = 0; i < output.imports.length; i++) {
      const importInfo = output.imports[i]!;

      // Check resolved import path
      const importPathMatch = matchesBlacklistPattern(
        importInfo.path,
        blacklistPatterns,
      );
      if (importPathMatch) {
        issues.push(
          createBlacklistedIssue(importInfo.path, outputPath, importPathMatch),
        );
      }

      // Check original import statement (exact import as written in source code)
      if (importInfo.original) {
        const originalMatch = matchesBlacklistPattern(
          importInfo.original,
          blacklistPatterns,
        );
        if (originalMatch) {
          issues.push(
            createBlacklistedIssue(
              importInfo.original,
              outputPath,
              originalMatch,
            ),
          );
        }
      }
    }
  }

  return issues;
}

/**
 * Generates comprehensive diagnostic issues for bundle artifacts including size violations and blacklisted imports. Provides actionable feedback for bundle optimization and dependency management.
 *
 * @param statsSlice - Unified bundle statistics containing output files and metadata
 * @param config - Bundle configuration with penalty options and diagnostic thresholds
 * @returns Array of diagnostic issues with severity levels and recommended actions
 */
export function getIssues(
  statsSlice: UnifiedStats,
  config: BundleStatsConfig,
): Issue[] {
  const issues: Issue[] = [];
  const { penalty = false } = config.scoring || { penalty: false };

  if (!penalty) {
    return issues;
  }

  const blacklistPatterns = penalty?.blacklist;
  const artefactSizeThresholds = penalty?.artefactSize;

  if (!blacklistPatterns?.length && !artefactSizeThresholds) {
    return issues;
  }

  const minArtifactSize = artefactSizeThresholds?.[0];
  const maxArtifactSize = artefactSizeThresholds?.[1];
  const hasBlacklist = blacklistPatterns && blacklistPatterns.length > 0;
  const hasSizeThresholds =
    minArtifactSize !== undefined || maxArtifactSize !== undefined;

  for (const outputPath in statsSlice) {
    const output = statsSlice[outputPath]!;

    if (hasSizeThresholds) {
      issues.push(
        ...checkSizeIssues(
          outputPath,
          output,
          minArtifactSize,
          maxArtifactSize,
        ),
      );
    }

    if (hasBlacklist) {
      issues.push(
        ...checkBlacklistIssues(outputPath, output, blacklistPatterns),
      );
    }
  }

  return issues;
}
