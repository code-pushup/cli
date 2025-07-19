import { minimatch } from 'minimatch';

export type PatternMatcher = (path: string) => boolean;

export interface MatchOptions {
  matchBase?: boolean;
  normalizeRelativePaths?: boolean;
}

const patternCache = new Map<string, PatternMatcher>();

// ===== CORE PATTERN MATCHING =====

/**
 * Normalizes path for pattern matching. Resolves relative segments for consistent glob matching.
 */
export function normalizePathForMatching(path: string): string {
  // Convert relative path segments to absolute-like paths for glob matching
  return path.replace(/\.\.\//g, '').replace(/^\/+/, '');
}

/**
 * Compiles pattern into cached matcher function. Avoids recompilation overhead.
 * Supports both normal and relative path matching with configurable options.
 */
export function compilePattern(
  pattern: string,
  options: MatchOptions = {},
): PatternMatcher {
  const cacheKey = `${pattern}:${JSON.stringify(options)}`;

  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey)!;
  }

  const matcher = (path: string) => {
    const minimatchOptions = options.matchBase ? { matchBase: true } : {};

    // Try original path first
    if (minimatch(path, pattern, minimatchOptions)) {
      return true;
    }

    // If normalizeRelativePaths is enabled, try normalized path
    if (options.normalizeRelativePaths) {
      const normalizedPath = normalizePathForMatching(path);
      return minimatch(normalizedPath, pattern, minimatchOptions);
    }

    return false;
  };

  patternCache.set(cacheKey, matcher);
  return matcher;
}

/**
 * Checks if a path matches any of the given patterns. Uses configurable matching options.
 */
export function matchesAnyPattern(
  path: string,
  patterns: readonly string[],
  options: MatchOptions = {},
): boolean {
  return patterns.some(pattern => {
    const matcher = compilePattern(pattern, options);
    return matcher(path);
  });
}

/**
 * Clears pattern cache. Prevents memory leaks in long-running processes.
 */
export function clearPatternCache(): void {
  patternCache.clear();
}

// ===== PATTERN ANALYSIS UTILITIES =====

/**
 * Extracts concrete (non-wildcard) segments from a glob pattern.
 * Provides the meaningful parts of patterns for analysis.
 */
export function extractConcreteSegments(pattern: string): string[] {
  return pattern
    .split('/')
    .filter(
      segment =>
        segment &&
        segment !== '**' &&
        segment !== '*' &&
        !segment.includes('*'),
    );
}

/**
 * Finds the index of a concrete segment within a file path.
 * Enables pattern-based path analysis for grouping purposes.
 */
export function findSegmentIndex(filePath: string, segment: string): number {
  const pathParts = filePath.split('/').filter(part => part !== '');
  return pathParts.findIndex(part => part === segment);
}

/**
 * Extracts a subsection of a path between start and end indices.
 * Provides controlled path slicing for grouping operations.
 */
export function extractPathSlice(
  filePath: string,
  startIndex: number,
  maxDepth?: number,
): string {
  const pathParts = filePath.split('/').filter(part => part !== '');
  const endIndex = maxDepth
    ? Math.min(startIndex + maxDepth, pathParts.length)
    : pathParts.length;

  return pathParts.slice(startIndex, endIndex).join('/');
}

/**
 * Extracts the most meaningful part from a file path.
 * Handles extension removal and fallback logic for generic names.
 */
export function extractMeaningfulPathPart(path: string): string | null {
  const parts = path.split('/').filter(part => part && part !== '.');

  if (parts.length === 0) return null;

  // Try last part first
  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    const withoutExt = lastPart.replace(/\.(js|ts|jsx|tsx|css|scss)$/, '');
    if (withoutExt && withoutExt !== 'index') {
      return withoutExt;
    }
  }

  // If last part is generic (like 'index'), try second-to-last
  if (parts.length > 1) {
    const secondLast = parts[parts.length - 2];
    if (secondLast) {
      return secondLast;
    }
  }

  return null;
}
