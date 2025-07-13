import { minimatch } from 'minimatch';

export type PatternMatcher = (path: string) => boolean;

interface MatchOptions {
  matchBase?: boolean;
  normalizeRelativePaths?: boolean;
}

const patternCache = new Map<string, PatternMatcher>();

/**
 * Normalizes path for pattern matching. Resolves relative segments for consistent glob matching.
 */
function normalizePathForMatching(path: string): string {
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
 * Extracts group name from path using pattern structure. Truly generic approach.
 */
function extractGroupNameFromPattern(
  originalPath: string,
  normalizedPath: string,
  pattern: string,
): string | null {
  // Find the first concrete directory in the pattern (not wildcards)
  const concreteSegments = pattern
    .split('/')
    .filter(
      segment =>
        segment &&
        segment !== '**' &&
        segment !== '*' &&
        !segment.includes('*'),
    );

  if (concreteSegments.length === 0) {
    // Pattern is all wildcards, extract last meaningful directory/file
    return extractLastMeaningfulPart(normalizedPath);
  }

  // Try to find the concrete segment in the path and extract the next level
  for (const segment of concreteSegments) {
    const regex = new RegExp(`${segment}\/([^\/]+)`);

    // Try both original and normalized paths
    const match = originalPath.match(regex) || normalizedPath.match(regex);
    if (match?.[1]) {
      const extracted = match[1];
      // Clean up the extracted name
      const cleaned = extracted.replace(/\.(js|ts|jsx|tsx|css|scss)$/, '');
      if (cleaned && cleaned !== 'index') {
        return cleaned;
      }
    }
  }

  return null;
}

/**
 * Extracts the last meaningful part from a path. Fallback for pure wildcard patterns.
 */
function extractLastMeaningfulPart(path: string): string | null {
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

/**
 * Derives a meaningful group title from a path and patterns. Extracts semantic names based on pattern structure.
 */
export function deriveGroupTitle(
  path: string,
  patterns: readonly string[],
  fallbackTitle: string,
): string {
  const normalizedPath = normalizePathForMatching(path);

  for (const pattern of patterns) {
    // Convert glob pattern to regex and find the "grouping segment"
    const groupName = extractGroupNameFromPattern(
      path,
      normalizedPath,
      pattern,
    );
    if (groupName) {
      return groupName;
    }
  }

  return fallbackTitle;
}

/**
 * Clears pattern cache. Prevents memory leaks in long-running processes.
 */
export function clearPatternCache(): void {
  patternCache.clear();
}

/**
 * Finds common path among multiple file paths. Returns the full shared path for better context.
 */
export function findCommonPath(paths: string[]): string {
  if (paths.length === 0) return 'Group';
  if (paths.length === 1) return deriveGroupTitle(paths[0]!, [], 'Group');

  // Check if all paths have the same relative prefix (like ../)
  const commonRelativePrefix = paths.every(path => path.startsWith('../'))
    ? '../'
    : '';

  // Normalize paths and split into segments
  const normalizedPaths = paths.map(path => {
    const normalized = path.startsWith('../')
      ? path.replace(/^(\.\.\/)+/, '')
      : path;
    return normalized.split('/').filter(segment => segment.length > 0);
  });

  // Find the longest common prefix
  const firstPath = normalizedPaths[0];
  if (!firstPath || firstPath.length === 0) return 'Group';

  let commonSegments: string[] = [];

  for (let i = 0; i < firstPath.length; i++) {
    const segment = firstPath[i];
    if (!segment) continue;

    const isCommonToAll = normalizedPaths.every(
      pathSegments => pathSegments && pathSegments[i] === segment,
    );

    if (isCommonToAll) {
      commonSegments.push(segment);
    } else {
      break;
    }
  }

  // Return the full shared path with preserved relative prefix
  if (commonSegments.length > 0) {
    return commonRelativePrefix + commonSegments.join('/') + '/**';
  }

  // If no common path, look for most common parent directory
  const parentDirs = normalizedPaths
    .map(pathSegments => {
      // Get the directory containing the file (not the file itself)
      const parentDir =
        pathSegments && pathSegments.length > 0
          ? pathSegments.slice(0, -1).pop()
          : undefined;
      return parentDir || '';
    })
    .filter(dir => dir.length > 0);

  // Find most common parent directory
  const dirCounts = parentDirs.reduce(
    (acc, dir) => {
      if (dir) {
        acc[dir] = (acc[dir] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>,
  );

  const mostCommonDir = Object.entries(dirCounts).sort(
    ([, a], [, b]) => b - a,
  )[0]?.[0];

  return mostCommonDir ? commonRelativePrefix + mostCommonDir + '/**' : 'Group';
}
