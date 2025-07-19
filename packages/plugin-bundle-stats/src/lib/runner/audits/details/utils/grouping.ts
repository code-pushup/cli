import type { GroupingRule } from '../../../types';
import { ARTEFACT_TYPE_ICON_MAP, DEFAULT_GROUP_NAME } from '../constants';
import {
  type MatchOptions,
  compilePattern,
  extractConcreteSegments,
  extractMeaningfulPathPart,
  extractPathSlice,
  findSegmentIndex,
  matchesAnyPattern,
  normalizePathForMatching,
} from './match-pattern';

// ===== TYPE DEFINITIONS =====

export type ArtefactType =
  | 'root'
  | 'script-file'
  | 'style-file'
  | 'entry-file'
  | 'static-import'
  | 'group';

export interface Node {
  name: string;
  bytes: number;
  sources: number;
}

export interface TreeNode extends Node {
  type?: ArtefactType;
  children: TreeNode[];
  icon?: string;
}

export interface GroupData {
  title: string;
  totalBytes: number;
  icon?: string;
}

export interface GroupManager<T extends GroupData = GroupData> {
  groups: Map<string, T>;
  findOrCreateGroup(key: string, rule: GroupingRule, defaultTitle?: string): T;
  getAllGroups(): T[];
  getGroupsWithData(): T[];
}

// ===== RULE MATCHING =====

/**
 * Finds the first matching rule for a given file path. Enables consistent rule matching across different contexts.
 */
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

// ===== GROUP EXTRACTION & ANALYSIS =====

/**
 * Extracts group key using pattern structure and depth control.
 * Supports both semantic extraction and depth-based grouping.
 */
function extractGroupKeyFromPattern(
  filePath: string,
  pattern: string,
  maxDepth?: number,
): string | null {
  const normalizedPath = normalizePathForMatching(filePath);
  const concreteSegments = extractConcreteSegments(pattern);

  if (concreteSegments.length === 0) {
    // Pattern is all wildcards, extract meaningful part
    return extractMeaningfulPathPart(normalizedPath);
  }

  // If maxDepth is specified, use depth-based extraction
  if (maxDepth && maxDepth > 0 && concreteSegments.length > 0) {
    const keyPart = concreteSegments[0]!; // Safe since we checked length > 0
    const keyIndex = findSegmentIndex(filePath, keyPart);

    if (keyIndex !== -1) {
      return extractPathSlice(filePath, keyIndex, maxDepth);
    }
  }

  // Try semantic extraction using regex patterns
  for (const segment of concreteSegments) {
    const regex = new RegExp(`${segment}\/([^\/]+)`);
    const match = filePath.match(regex) || normalizedPath.match(regex);

    if (match?.[1]) {
      const extracted = match[1];
      const cleaned = extracted.replace(/\.(js|ts|jsx|tsx|css|scss)$/, '');
      if (cleaned && cleaned !== 'index') {
        return cleaned;
      }
    }
  }

  return null;
}

/**
 * Derives a meaningful group title from a path and patterns.
 * Combines pattern analysis with fallback logic for robust group naming.
 */
export function deriveGroupTitle(
  path: string,
  patterns: readonly string[],
  fallbackTitle: string,
): string {
  for (const pattern of patterns) {
    const concreteSegments = extractConcreteSegments(pattern);

    // If the pattern contains a concrete segment that matches the fallback title,
    // use the fallback title instead of extracting individual file names
    if (concreteSegments.includes(fallbackTitle)) {
      return fallbackTitle;
    }

    // Try pattern-based extraction
    const groupName = extractGroupKeyFromPattern(path, pattern);
    if (groupName) {
      return cleanupGroupName(groupName);
    }
  }

  return fallbackTitle;
}

/**
 * Cleans up and improves group names for better readability.
 * Handles common patterns like scoped packages, file extensions, and generic names.
 */
function cleanupGroupName(groupName: string): string {
  // Handle scoped packages like @angular/core, @babel/preset-env
  if (groupName.startsWith('@')) {
    const scopedMatch = groupName.match(/@([^/]+)(?:\/([^/]+))?/);
    if (scopedMatch) {
      const [, scope, packageName] = scopedMatch;
      if (packageName) {
        // Return scope name with first package for readability
        return `@${scope}/${packageName}`;
      } else {
        // Just the scope
        return `@${scope}`;
      }
    }
  }

  // Handle node_modules paths - extract package name
  if (groupName.includes('node_modules/')) {
    const parts = groupName.split('node_modules/');
    const packagePart = parts[1];
    if (packagePart) {
      // Handle scoped packages in node_modules
      if (packagePart.startsWith('@')) {
        const scopedParts = packagePart.split('/');
        if (scopedParts.length >= 2) {
          return `${scopedParts[0]}/${scopedParts[1]}`;
        }
      }
      // Handle regular packages
      const packageName = packagePart.split('/')[0];
      return packageName || groupName;
    }
  }

  // Remove common file extensions for cleaner names
  const withoutExt = groupName.replace(/\.(js|ts|jsx|tsx|css|scss|json)$/, '');

  // Avoid generic names like 'index'
  if (withoutExt === 'index' || withoutExt === 'main') {
    return groupName; // Return original if cleanup made it too generic
  }

  return withoutExt || groupName;
}

/**
 * Extracts the appropriate group key from a file path based on patterns and maxDepth.
 * Provides intelligent auto-grouping that considers pattern structure for organized bundle analysis.
 */
export function extractIntelligentGroupKey(
  filePath: string,
  patterns: readonly string[],
  maxDepth: number,
): string {
  const pathParts = filePath.split('/').filter(part => part !== '');

  // For simple depth-based grouping, just take the first maxDepth parts
  const simpleGroupKey = pathParts.slice(0, maxDepth).join('/');

  // Try to find a pattern that gives us more context for intelligent grouping
  for (const pattern of patterns) {
    const patternKey = extractGroupKeyFromPattern(filePath, pattern, maxDepth);
    if (patternKey) {
      return patternKey;
    }
  }

  // Fallback to simple depth-based grouping
  return simpleGroupKey;
}

/**
 * Checks if the paths represent a pattern of scoped packages and returns an appropriate group name.
 * Handles cases like @angular/core, @angular/common, @babel/preset-env, etc.
 */
function checkForScopedPackages(paths: string[]): string | null {
  const scopeGroups = new Map<string, number>();
  let totalScopedPaths = 0;

  for (const path of paths) {
    // Look for scoped package pattern in the path
    const scopedMatch = path.match(/.*\/@([^/]+)\/[^/]+/);
    if (scopedMatch) {
      const scope = scopedMatch[1];
      if (scope) {
        scopeGroups.set(scope, (scopeGroups.get(scope) || 0) + 1);
        totalScopedPaths++;
      }
    }
  }

  // If most paths are scoped packages
  if (totalScopedPaths > paths.length * 0.6) {
    // If one scope dominates, use it
    const dominantScope = [...scopeGroups.entries()].sort(
      ([, a], [, b]) => b - a,
    )[0];

    if (dominantScope && dominantScope[1] > totalScopedPaths * 0.5) {
      return `@${dominantScope[0]}`;
    }

    // Otherwise, general scoped packages group
    return 'Scoped Packages';
  }

  return null;
}

/**
 * Finds common path among multiple file paths. Returns the full shared path for better context.
 */
export function findCommonPath(paths: string[]): string {
  if (paths.length === 0) return DEFAULT_GROUP_NAME;
  if (paths.length === 1)
    return deriveGroupTitle(paths[0]!, [], DEFAULT_GROUP_NAME);

  // Check for scoped packages pattern first
  const scopedPackagePattern = checkForScopedPackages(paths);
  if (scopedPackagePattern) {
    return scopedPackagePattern;
  }

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

  // Return the full shared path with preserved relative prefix
  if (commonSegments.length > 0) {
    const commonPath = commonRelativePrefix + commonSegments.join('/') + '/**';

    // Avoid returning patterns that include wildcards or are unreadable
    if (commonPath.includes('@*/') || commonPath.includes('*/')) {
      return DEFAULT_GROUP_NAME;
    }

    return commonPath;
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

  return mostCommonDir
    ? commonRelativePrefix + mostCommonDir + '/**'
    : DEFAULT_GROUP_NAME;
}

// ===== GROUP MANAGEMENT =====

/**
 * Creates a group manager for handling group operations.
 * Provides consistent group management across different grouping contexts.
 */
export function createGroupManager<T extends GroupData>(): GroupManager<T> {
  const groups = new Map<string, T>();

  return {
    groups,
    findOrCreateGroup(
      key: string,
      rule: GroupingRule,
      defaultTitle?: string,
    ): T {
      let group = groups.get(key);
      if (!group) {
        const title = rule.title || defaultTitle || key;
        group = {
          title,
          totalBytes: 0,
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
      return [...groups.values()].filter(g => g.totalBytes > 0);
    },
  };
}

/**
 * Generates a group key for a file path and rule.
 * Provides consistent group key generation for both flat and hierarchical grouping.
 */
export function generateGroupKey(filePath: string, rule: GroupingRule): string {
  return deriveGroupTitle(
    filePath,
    rule.patterns,
    rule.title || DEFAULT_GROUP_NAME,
  );
}

// ===== TREE OPERATIONS =====

/**
 * Separates source files and dependencies within grouped nodes.
 * Enables organized separation of internal sources from external dependencies.
 */
export function separateSourcesAndDependencies(
  nodes: TreeNode[],
  groups: GroupingRule[],
): TreeNode[] {
  if (!groups || groups.length === 0) {
    return nodes;
  }

  return nodes.map(node => {
    if (node.children.length === 0) {
      return node;
    }

    return {
      ...node,
      children: separateSourcesAndDependencies(node.children, groups),
    };
  });
}

/**
 * Groups tree nodes based on patterns and creates nested folder structures.
 * Enables organized bundle analysis with configurable depth levels.
 */
export function applyGrouping(
  nodes: TreeNode[],
  groups: GroupingRule[],
): TreeNode[] {
  if (!groups || groups.length === 0) {
    return nodes;
  }

  const newNodes = nodes.map(node => ({
    ...node,
    children: applyGrouping(node.children, groups),
  }));

  let finalNodes = [...newNodes];

  for (const group of [...groups].reverse()) {
    const { title, patterns, icon, maxDepth } = group;

    const nodesToGroup: TreeNode[] = [];
    const remainingNodes: TreeNode[] = [];

    finalNodes.forEach(node => {
      if (
        matchesAnyPattern(node.name, patterns, {
          matchBase: true,
          normalizeRelativePaths: true,
        })
      ) {
        nodesToGroup.push(node);
      } else {
        remainingNodes.push(node);
      }
    });

    if (nodesToGroup.length > 0) {
      let groupedNodes: TreeNode[] = [];

      if (maxDepth && maxDepth > 0) {
        // Create nested folder structure based on maxDepth with pattern-aware grouping
        const pathGroups = new Map<string, TreeNode[]>();

        nodesToGroup.forEach(node => {
          const groupKey = extractIntelligentGroupKey(
            node.name,
            patterns,
            maxDepth,
          );

          if (!pathGroups.has(groupKey)) {
            pathGroups.set(groupKey, []);
          }
          pathGroups.get(groupKey)!.push(node);
        });

        // Convert path groups to tree nodes
        pathGroups.forEach((nodesInGroup, groupPath) => {
          const totalBytes = nodesInGroup.reduce(
            (sum, node) => sum + node.bytes,
            0,
          );
          const totalSources = nodesInGroup.reduce(
            (sum, node) => sum + node.sources,
            0,
          );

          const folderNode: TreeNode = {
            name: groupPath,
            bytes: totalBytes,
            sources: totalSources,
            type: 'group',
            children: nodesInGroup,
            icon: icon || ARTEFACT_TYPE_ICON_MAP['group'],
          };

          groupedNodes.push(folderNode);
        });
      } else {
        // Original single-group behavior with improved title derivation
        let effectiveTitle: string;

        if (title) {
          // Use explicit title if provided
          effectiveTitle = title;
        } else {
          // Try to derive a meaningful title from the grouped nodes
          const samplePath = nodesToGroup[0]?.name || '';
          effectiveTitle = deriveGroupTitle(
            samplePath,
            patterns,
            'Dependencies',
          );

          // If derivation didn't improve the name much, use findCommonPath as fallback
          if (
            effectiveTitle === 'Dependencies' ||
            effectiveTitle.includes('*')
          ) {
            effectiveTitle = findCommonPath(
              nodesToGroup.map(node => node.name),
            );

            // Final cleanup for unreadable patterns like @*/*
            if (
              effectiveTitle.includes('@*/') ||
              effectiveTitle.includes('*')
            ) {
              effectiveTitle = 'Dependencies';
            }
          }
        }

        const totalBytes = nodesToGroup.reduce(
          (sum, node) => sum + node.bytes,
          0,
        );
        const totalSources = nodesToGroup.reduce(
          (sum, node) => sum + node.sources,
          0,
        );

        const groupNode: TreeNode = {
          name: effectiveTitle,
          bytes: totalBytes,
          sources: totalSources,
          type: 'group',
          children: nodesToGroup,
          icon,
        };

        groupedNodes.push(groupNode);
      }

      remainingNodes.push(...groupedNodes);
    }

    finalNodes = remainingNodes;
  }

  return finalNodes;
}
