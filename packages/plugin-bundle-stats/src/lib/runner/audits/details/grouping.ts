import { minimatch } from 'minimatch';
import type { GroupingRule, LogicalGroupingRule } from '../../types';
import {
  cleanupGroupName,
  deriveGroupTitle,
  extractGroupKeyFromPattern,
} from './formatting';
import type { ArtefactType, StatsNodeValues } from './types';

export type PatternMatcher = (path: string) => boolean;

// Pattern cache to avoid recompiling the same patterns
const PATTERN_CACHE = new Map<string, PatternMatcher>();

/**
 * Normalizes patterns from string | PatternList to readonly string[].
 */
function normalizePatterns(
  patterns?: string | readonly string[],
): readonly string[] {
  if (!patterns) return [];

  const normalizedArray = typeof patterns === 'string' ? [patterns] : patterns;

  // Filter out any undefined, null, or empty string values
  return normalizedArray.filter(
    (pattern): pattern is string =>
      typeof pattern === 'string' && pattern.trim() !== '',
  );
}

export interface MatchOptions {
  matchBase?: boolean;
  normalizeRelativePaths?: boolean;
}

export type GroupData = Omit<StatsNodeValues, 'type' | 'path'> & {
  title: string;
  type: 'group';
};

export interface GroupManager<T extends GroupData = GroupData> {
  groups: Map<string, T>;
  findOrCreateGroup(
    key: string,
    rule: LogicalGroupingRule,
    defaultTitle?: string,
  ): T;
  getAllGroups(): T[];
  getGroupsWithData(): T[];
}

export type StatsTreeNode = {
  children: StatsTreeNode[];
  name: string;
  values: StatsNodeValues;
};

export interface StatsTree {
  root: StatsTreeNode;
}

const DEFAULT_GROUP_NAME = 'Group';

export function splitPathSegments(path: string): string[] {
  return path.split('/').filter(part => part !== '');
}

export function normalizePathForMatching(path: string): string {
  return path.replace(/\.\.\//g, '').replace(/^\/+/, '');
}

/**
 * Compiles pattern into cached matcher function. Avoids recompilation overhead.
 */
export function compilePattern(
  pattern: string,
  options: MatchOptions = {},
): PatternMatcher {
  // Create cache key from pattern and options
  const cacheKey = `${pattern}|${JSON.stringify(options)}`;

  // Return cached pattern if available
  const cached = PATTERN_CACHE.get(cacheKey);
  if (cached) return cached;

  // Compile new pattern
  const matcher = (path: string) => {
    const minimatchOptions = options.matchBase ? { matchBase: true } : {};
    if (minimatch(path, pattern, minimatchOptions)) return true;
    if (options.normalizeRelativePaths) {
      const normalizedPath = normalizePathForMatching(path);
      return minimatch(normalizedPath, pattern, minimatchOptions);
    }
    return false;
  };

  // Cache and return
  PATTERN_CACHE.set(cacheKey, matcher);
  return matcher;
}

/**
 * Checks if path matches a GroupingRule using include/exclude logic
 */
function matchesGroupingRule(
  path: string,
  rule: GroupingRule,
  options: MatchOptions = {},
): boolean {
  const includePatterns = normalizePatterns(rule.includeInputs);
  const excludePatterns = normalizePatterns(rule.excludeInputs);

  return evaluatePathWithIncludeExclude(
    path,
    includePatterns,
    excludePatterns,
    options,
  );
}

/**
 * Separates patterns into include and exclude arrays. Exclude patterns start with !
 * @deprecated - Use the new include/exclude GroupingRule format instead
 */
function separateIncludeExcludePatterns(patterns: readonly string[]): {
  includePatterns: string[];
  excludePatterns: string[];
} {
  const includePatterns: string[] = [];
  const excludePatterns: string[] = [];

  for (const pattern of patterns) {
    if (pattern.startsWith('!')) {
      excludePatterns.push(pattern.slice(1)); // Remove ! prefix
    } else {
      includePatterns.push(pattern);
    }
  }

  return { includePatterns, excludePatterns };
}

/**
 * Evaluates path against include/exclude patterns using the same logic as selection system
 */
function evaluatePathWithIncludeExclude(
  path: string,
  includePatterns: readonly string[],
  excludePatterns: readonly string[],
  options: MatchOptions = {},
): boolean {
  // If exclude patterns exist, check if path matches any - if so, exclude it
  if (excludePatterns.length > 0) {
    for (const pattern of excludePatterns) {
      const matcher = compilePattern(pattern, options);
      if (matcher(path)) {
        return false;
      }
    }
  }

  // If no include patterns, include everything (after exclusion check)
  if (includePatterns.length === 0) {
    return true;
  }

  // Check if path matches any include pattern
  for (const pattern of includePatterns) {
    const matcher = compilePattern(pattern, options);
    if (matcher(path)) {
      return true;
    }
  }

  return false;
}

export function matchesAnyPattern(
  path: string,
  patterns: readonly string[],
  options: MatchOptions = {},
): boolean {
  // Legacy support for old patterns array format
  const { includePatterns, excludePatterns } =
    separateIncludeExcludePatterns(patterns);
  return evaluatePathWithIncludeExclude(
    path,
    includePatterns,
    excludePatterns,
    options,
  );
}

/**
 * Finds first matching rule for path. Processes rules in forward order for top-down precedence.
 */
export function findMatchingRule(
  filePath: string,
  rules: GroupingRule[],
): GroupingRule | null {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (
      rule &&
      matchesGroupingRule(filePath, rule, {
        matchBase: true,
        normalizeRelativePaths: true,
      })
    ) {
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
  if (preferRuleTitle && rule.title) return rule.title;

  // For new include/exclude format, use the include patterns for title generation
  const includePatterns = normalizePatterns(rule.includeInputs);
  return deriveGroupTitle(
    filePath,
    includePatterns,
    rule.title || DEFAULT_GROUP_NAME,
  );
}

export function createGroupManager<T extends GroupData>(): GroupManager<T> {
  const groups = new Map<string, T>();
  return {
    groups,
    findOrCreateGroup(
      key: string,
      rule: LogicalGroupingRule,
      defaultTitle?: string,
    ): T {
      let group = groups.get(key);
      if (!group) {
        const title = rule.title || defaultTitle || key;
        group = {
          title,
          bytes: 0,
          modules: 0,
          type: 'group',
          icon: rule.icon,
        } as T;
        groups.set(key, group);
      }
      return group;
    },
    getAllGroups(): T[] {
      return [...groups.values()];
    },
    getGroupsWithData(): T[] {
      return [...groups.values()].filter(g => g.bytes > 0);
    },
  };
}

export function toLogicalGroupingRule(rule: GroupingRule): LogicalGroupingRule {
  const { numSegments: maxDepth, ...rest } = rule;
  return { ...rest, maxDepth: 1 };
}

export function findOrCreateGroupFromRule<T extends GroupData>(
  groupManager: GroupManager<T>,
  key: string,
  rule: GroupingRule,
  defaultTitle?: string,
): T {
  const logicalRule = toLogicalGroupingRule(rule);
  return groupManager.findOrCreateGroup(key, logicalRule, defaultTitle);
}

export function processForTable(
  filePath: string,
  rules: GroupingRule[],
  preferRuleTitle = true,
): { rule: GroupingRule | null; groupKey: string | null } {
  const rule = findMatchingRule(filePath, rules);
  if (!rule) return { rule: null, groupKey: null };
  const groupKey = generateGroupKey(filePath, rule, preferRuleTitle);
  return { rule, groupKey };
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

function extractIntelligentGroupKey(
  filePath: string,
  patterns: readonly string[],
  maxDepth: number,
): string {
  const pathParts = splitPathSegments(filePath);

  // Try pattern-based extraction first
  for (const pattern of patterns) {
    const patternKey = extractGroupKeyFromPattern(filePath, pattern, maxDepth);
    if (patternKey) return patternKey;
  }

  // Fallback to simple depth-based extraction from the beginning of path
  if (pathParts.length >= maxDepth) {
    return pathParts.slice(0, maxDepth).join('/');
  }

  // If path is shorter than maxDepth, use the whole path
  return pathParts.join('/');
}

function checkForScopedPackages(paths: string[]): string | null {
  const scopeGroups = new Map<string, number>();
  let totalScopedPaths = 0;
  for (const path of paths) {
    const scopedMatch = path.match(/.*\/@([^/]+)\/[^/]+/);
    if (scopedMatch) {
      const scope = scopedMatch[1];
      if (scope) {
        scopeGroups.set(scope, (scopeGroups.get(scope) || 0) + 1);
        totalScopedPaths++;
      }
    }
  }
  if (totalScopedPaths > paths.length * 0.6) {
    const dominantScope = [...scopeGroups.entries()].sort(
      ([, a], [, b]) => (b as number) - (a as number),
    )[0];
    if (dominantScope && dominantScope[1] > totalScopedPaths * 0.5) {
      return `@${dominantScope[0]}`;
    }
    return 'Scoped Packages';
  }
  return null;
}

function findCommonPath(paths: string[]): string {
  if (paths.length === 0) return DEFAULT_GROUP_NAME;
  if (paths.length === 1)
    return deriveGroupTitle(paths[0]!, [], DEFAULT_GROUP_NAME);

  const scopedPackagePattern = checkForScopedPackages(paths);
  if (scopedPackagePattern) return scopedPackagePattern;

  const commonRelativePrefix = paths.every(path => path.startsWith('../'))
    ? '../'
    : '';
  const normalizedPaths = paths.map(path => {
    const normalized = path.startsWith('../')
      ? path.replace(/^(\.\.\/)+/, '')
      : path;
    return splitPathSegments(normalized);
  });

  const firstPath = normalizedPaths[0];
  if (!firstPath || firstPath.length === 0) return DEFAULT_GROUP_NAME;

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

  if (commonSegments.length > 0) {
    const commonPath = commonRelativePrefix + commonSegments.join('/') + '/**';
    if (commonPath.includes('@*/') || commonPath.includes('*/'))
      return DEFAULT_GROUP_NAME;
    return commonPath;
  }

  const parentDirs = normalizedPaths
    .map(pathSegments => {
      const parentDir =
        pathSegments && pathSegments.length > 0
          ? pathSegments.slice(0, -1).pop()
          : undefined;
      return parentDir || '';
    })
    .filter(dir => dir.length > 0);

  const dirCounts = parentDirs.reduce(
    (acc, dir) => {
      if (dir) acc[dir] = (acc[dir] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const mostCommonDir = Object.entries(dirCounts).sort(
    ([, a], [, b]) => (b as number) - (a as number),
  )[0]?.[0];
  return mostCommonDir
    ? commonRelativePrefix + mostCommonDir + '/**'
    : DEFAULT_GROUP_NAME;
}

/**
 * Groups nodes by patterns at current level only. Organizes files into logical groups without recursive processing.
 */
export function applyGrouping(
  nodes: StatsTreeNode[],
  groups: GroupingRule[],
): StatsTreeNode[] {
  if (!groups || groups.length === 0) {
    return [...nodes].sort((a, b) => b.values.bytes - a.values.bytes);
  }

  // Process nodes without recursive grouping - caller handles recursion
  let finalNodes = [...nodes];
  // Track original input nodes vs newly created group nodes
  const originalNodes = new Set(nodes);
  finalNodes.sort((a, b) => b.values.bytes - a.values.bytes);

  for (const group of groups) {
    const {
      title,
      includeInputs,
      excludeInputs,
      icon,
      numSegments: maxDepth,
    } = group;
    const nodesToGroup: StatsTreeNode[] = [];
    const remainingNodes: StatsTreeNode[] = [];

    finalNodes.forEach(node => {
      const matchingRule = findMatchingRule(node.name, [group]);
      if (matchingRule && originalNodes.has(node)) {
        // Only group original input nodes, not previously created group nodes
        nodesToGroup.push(node);
      } else {
        remainingNodes.push(node);
      }
    });

    if (nodesToGroup.length > 0) {
      let groupedNodes: StatsTreeNode[] = [];

      // When reduce is true, always create a single consolidated group
      const shouldCreateSingleGroup = !maxDepth || maxDepth === 0;

      if (!shouldCreateSingleGroup && maxDepth && maxDepth > 0) {
        const pathGroups = new Map<string, StatsTreeNode[]>();
        nodesToGroup.forEach(node => {
          const groupKey = extractIntelligentGroupKey(
            node.name,
            normalizePatterns(includeInputs),
            maxDepth,
          );
          if (!pathGroups.has(groupKey)) pathGroups.set(groupKey, []);
          pathGroups.get(groupKey)!.push(node);
        });

        pathGroups.forEach((nodesInGroup, groupPath) => {
          const totalBytes = nodesInGroup.reduce(
            (sum, node) => sum + node.values.bytes,
            0,
          );
          const totalModules = nodesInGroup.reduce(
            (sum, node) => sum + node.values.modules,
            0,
          );

          const folderNode: StatsTreeNode = {
            name: title || cleanupGroupName(groupPath),
            values: {
              path: groupPath,
              bytes: totalBytes,
              modules: totalModules,
              type: 'group',
              icon: icon,
            },
            children: nodesInGroup.sort(
              (a, b) => b.values.bytes - a.values.bytes,
            ),
          };
          groupedNodes.push(folderNode);
        });
      } else {
        let effectiveTitle: string;
        if (title) {
          effectiveTitle = title;
        } else {
          const samplePath = nodesToGroup[0]?.name || '';
          effectiveTitle = deriveGroupTitle(
            samplePath,
            normalizePatterns(includeInputs),
            DEFAULT_GROUP_NAME,
          );
        }

        const totalBytes = nodesToGroup.reduce(
          (sum, node) => sum + node.values.bytes,
          0,
        );
        const totalModules = nodesToGroup.reduce(
          (sum, node) => sum + node.values.modules,
          0,
        );

        const groupNode: StatsTreeNode = {
          name: effectiveTitle,
          values: {
            path: '',
            bytes: totalBytes,
            modules: totalModules,
            type: 'group',
            icon,
          },
          // When reduce is true, don't show children - collapse to summary only
          children: nodesToGroup.sort(
            (a, b) => b.values.bytes - a.values.bytes,
          ),
        };
        groupedNodes.push(groupNode);
      }

      groupedNodes.sort((a, b) => b.values.bytes - a.values.bytes);
      remainingNodes.push(...groupedNodes);
    }

    finalNodes = remainingNodes;
    finalNodes.sort((a, b) => b.values.bytes - a.values.bytes);
  }

  // Filter out files that are excluded by any group's exclude patterns
  return finalNodes.filter(node => {
    // Keep group nodes (created by grouping process)
    if (!originalNodes.has(node)) {
      return true;
    }

    // For original nodes, check if they're excluded by any group
    return !groups.some(group => {
      if (!group.excludeInputs || group.excludeInputs.length === 0) {
        return false;
      }

      const excludePatterns = normalizePatterns(group.excludeInputs);
      return excludePatterns.some(pattern => {
        const matcher = compilePattern(pattern);
        return matcher(node.name);
      });
    });
  });
}
