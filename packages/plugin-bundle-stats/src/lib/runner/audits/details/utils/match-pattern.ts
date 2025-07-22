import { minimatch } from 'minimatch';
import type { GroupingRule } from '../../../types.js';
import { deriveGroupTitle } from './formatting';

const DEFAULT_GROUP_NAME = 'Group';

export type PatternMatcher = (path: string) => boolean;

export interface MatchOptions {
  matchBase?: boolean;
  normalizeRelativePaths?: boolean;
}

export const patternCache = new Map<string, PatternMatcher>();

export function splitPathSegments(path: string): string[] {
  return path.split('/').filter(part => part !== '');
}

export function normalizePathForMatching(path: string): string {
  return path.replace(/\.\.\//g, '').replace(/^\/+/, '');
}

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

    if (minimatch(path, pattern, minimatchOptions)) {
      return true;
    }

    if (options.normalizeRelativePaths) {
      const normalizedPath = normalizePathForMatching(path);
      return minimatch(normalizedPath, pattern, minimatchOptions);
    }

    return false;
  };

  patternCache.set(cacheKey, matcher);
  return matcher;
}

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

export function clearPatternCache(): void {
  patternCache.clear();
}

/**
 * Compiles multiple patterns into matcher functions. Avoids individual compilation overhead.
 */
export function compilePatterns(
  patterns: string[],
  options: MatchOptions = { normalizeRelativePaths: true },
): PatternMatcher[] {
  return patterns.map(pattern => compilePattern(pattern, options));
}

/**
 * Evaluates paths against include/exclude patterns. Enables selective filtering with both allow and deny rules.
 */
export function evaluatePathsWithIncludeExclude(
  paths: string[],
  includePatterns: PatternMatcher[],
  excludePatterns: PatternMatcher[],
): boolean {
  if (paths.length === 0) {
    return includePatterns.length === 0;
  }

  if (includePatterns.length === 0 && excludePatterns.length === 0) {
    return true;
  }

  if (
    excludePatterns.length > 0 &&
    paths.some(path => excludePatterns.some(matcher => matcher(path)))
  ) {
    return false;
  }

  if (includePatterns.length === 0) {
    return true;
  }

  return paths.some(path => includePatterns.some(matcher => matcher(path)));
}

export function extractConcreteSegments(pattern: string): string[] {
  return splitPathSegments(pattern).filter(
    segment => segment !== '**' && segment !== '*' && !segment.includes('*'),
  );
}

export function findSegmentIndex(filePath: string, segment: string): number {
  return splitPathSegments(filePath).findIndex(part => part === segment);
}

export function extractPathSlice(
  filePath: string,
  startIndex: number,
  maxDepth?: number,
): string {
  const pathParts = splitPathSegments(filePath);
  const endIndex = maxDepth
    ? Math.min(startIndex + maxDepth, pathParts.length)
    : pathParts.length;

  return pathParts.slice(startIndex, endIndex).join('/');
}

export function findMatchingRule(
  filePath: string,
  rules: GroupingRule[],
  options: MatchOptions = { matchBase: true, normalizeRelativePaths: true },
): GroupingRule | null {
  for (const rule of rules) {
    if (matchesAnyPattern(filePath, rule.patterns, options)) {
      return rule;
    }
  }
  return null;
}

export function generateGroupKey(
  filePath: string,
  rule: GroupingRule,
  preferRuleTitle = false,
): string {
  if (preferRuleTitle && rule.title) {
    return rule.title;
  }

  return deriveGroupTitle(
    filePath,
    rule.patterns,
    rule.title || DEFAULT_GROUP_NAME,
  );
}
