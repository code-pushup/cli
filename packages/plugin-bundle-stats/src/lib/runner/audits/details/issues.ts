import { minimatch } from 'minimatch';
import type { Issue } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { BundleStatsConfig } from '../../types.js';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
} from '../../unify/unified-stats.types.js';
import type { BlacklistEntry, BlacklistPatternList } from '../scoring.js';

// ===== PERFORMANCE OPTIMIZATIONS =====

// Cache for blacklist pattern matches to avoid repeated minimatch calls
const BLACKLIST_PATTERN_CACHE = new Map<string, boolean>();

// Clear cache when it gets too large to prevent memory issues
function clearCacheIfNeeded(): void {
  if (BLACKLIST_PATTERN_CACHE.size > 50_000) {
    BLACKLIST_PATTERN_CACHE.clear();
  }
}

// ===== ISSUE ICONS =====

export const ISSUE_ICONS = {
  TOO_LARGE: '🔺',
  TOO_SMALL: '🔻',
  BLACKLIST: '🚫',
} as const;

/**
 * Normalizes blacklist entry to extract pattern string and hint.
 */
function normalizeBlacklistEntry(entry: BlacklistEntry): {
  pattern: string;
  hint?: string;
} {
  if (typeof entry === 'string') {
    return { pattern: entry };
  }
  return { pattern: entry.pattern, hint: entry.hint };
}

/**
 * Optimized pattern matching with caching. Avoids repeated minimatch calls for same path-pattern pairs.
 */
function matchesPattern(path: string, pattern: string): boolean {
  const cacheKey = `${path}|${pattern}`;

  const cached = BLACKLIST_PATTERN_CACHE.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const result = minimatch(path, pattern, { matchBase: true });
  BLACKLIST_PATTERN_CACHE.set(cacheKey, result);

  return result;
}

/**
 * Checks if a path matches any of the given blacklist patterns. Enables pattern-based filtering with optimized caching.
 */
function matchesBlacklistPattern(
  path: string,
  patterns: BlacklistPatternList,
): { pattern: string; hint?: string } | null {
  // Clear cache periodically to prevent memory bloat
  clearCacheIfNeeded();

  for (const entry of patterns) {
    const { pattern, hint } = normalizeBlacklistEntry(entry);
    if (matchesPattern(path, pattern)) {
      return { pattern, hint };
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
 */
export function createBlacklistedIssue(
  importPath: string,
  outputPath: string,
  pattern: string,
  hint?: string,
): Issue {
  const baseMessage = `${ISSUE_ICONS.BLACKLIST} \`${importPath}\` matches blacklist pattern \`${pattern}\``;
  const message = hint ? `${baseMessage} - ${hint}` : baseMessage;

  return {
    message,
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
 * @param blacklistPatterns - Array of blacklist patterns (strings or objects with hints)
 * @returns Array of blacklist-related issues found
 */
export function checkBlacklistIssues(
  outputPath: string,
  output: UnifiedStatsBundle,
  blacklistPatterns: BlacklistPatternList,
): Issue[] {
  const issues: Issue[] = [];

  // 1. Check output path itself (object key in outputs section)
  const outputPathMatch = matchesBlacklistPattern(
    outputPath,
    blacklistPatterns,
  );
  if (outputPathMatch) {
    issues.push(
      createBlacklistedIssue(
        outputPath,
        outputPath,
        outputPathMatch.pattern,
        outputPathMatch.hint,
      ),
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
        createBlacklistedIssue(
          output.entryPoint,
          outputPath,
          entryPointMatch.pattern,
          entryPointMatch.hint,
        ),
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
          createBlacklistedIssue(
            inputPath,
            outputPath,
            matchedPattern.pattern,
            matchedPattern.hint,
          ),
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
          createBlacklistedIssue(
            importInfo.path,
            outputPath,
            importPathMatch.pattern,
            importPathMatch.hint,
          ),
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
              originalMatch.pattern,
              originalMatch.hint,
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
  // Clear cache at start of each audit run for clean state
  BLACKLIST_PATTERN_CACHE.clear();

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

  // Track unique blacklisted patterns per bundle to avoid duplicates
  const blacklistedPatterns = new Map<
    string,
    { pattern: string; hint?: string; files: string[]; outputPath: string }
  >();

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
      // Collect blacklisted patterns without creating issues yet
      collectBlacklistedPatterns(
        outputPath,
        output,
        blacklistPatterns,
        blacklistedPatterns,
      );
    }
  }

  // Create unique issues for blacklisted patterns
  for (const [
    patternKey,
    { pattern, hint, files, outputPath },
  ] of blacklistedPatterns) {
    if (files.length === 1) {
      // Single file - show specific file name
      issues.push(createBlacklistedIssue(files[0]!, outputPath, pattern, hint));
    } else {
      // Multiple files - show pattern summary
      const summaryMessage = `Blacklisted modules matching \`${pattern}\` included in file`;
      issues.push(
        createBlacklistedPatternIssue(
          summaryMessage,
          outputPath,
          pattern,
          hint,
          files,
        ),
      );
    }
  }

  return issues;
}

/**
 * Creates error issue for multiple blacklisted files from same pattern. Consolidates multiple violations into single issue.
 */
export function createBlacklistedPatternIssue(
  summaryMessage: string,
  outputPath: string,
  pattern: string,
  hint?: string,
  files?: string[],
): Issue {
  const baseMessage = `${ISSUE_ICONS.BLACKLIST} ${summaryMessage}`;
  const message = hint ? `${baseMessage} - ${hint}` : baseMessage;

  return {
    message,
    severity: 'error',
    source: { file: outputPath },
  };
}

/**
 * Collects blacklisted patterns without creating duplicate issues. Groups by pattern per bundle.
 */
function collectBlacklistedPatterns(
  outputPath: string,
  output: UnifiedStatsBundle,
  blacklistPatterns: BlacklistPatternList,
  blacklistedPatterns: Map<
    string,
    { pattern: string; hint?: string; files: string[]; outputPath: string }
  >,
): void {
  const addToPattern = (
    filePath: string,
    matchResult: { pattern: string; hint?: string },
  ) => {
    const patternKey = `${outputPath}:${matchResult.pattern}`;
    if (blacklistedPatterns.has(patternKey)) {
      const existing = blacklistedPatterns.get(patternKey)!;
      if (!existing.files.includes(filePath)) {
        existing.files.push(filePath);
      }
    } else {
      blacklistedPatterns.set(patternKey, {
        pattern: matchResult.pattern,
        hint: matchResult.hint,
        files: [filePath],
        outputPath,
      });
    }
  };

  // 1. Check output path itself (object key in outputs section)
  const outputPathMatch = matchesBlacklistPattern(
    outputPath,
    blacklistPatterns,
  );
  if (outputPathMatch) {
    addToPattern(outputPath, outputPathMatch);
  }

  // 2. Check entryPoint property
  if (output.entryPoint) {
    const entryPointMatch = matchesBlacklistPattern(
      output.entryPoint,
      blacklistPatterns,
    );
    if (entryPointMatch) {
      addToPattern(output.entryPoint, entryPointMatch);
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
        addToPattern(inputPath, matchedPattern);
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
        addToPattern(importInfo.path, importPathMatch);
      }

      // Check original import statement (exact import as written in source code)
      if (importInfo.original) {
        const originalMatch = matchesBlacklistPattern(
          importInfo.original,
          blacklistPatterns,
        );
        if (originalMatch) {
          addToPattern(importInfo.original, originalMatch);
        }
      }
    }
  }
}
