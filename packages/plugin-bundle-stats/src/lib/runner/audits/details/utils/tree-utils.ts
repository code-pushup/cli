import type { GroupingRule } from '../../../types';
import { deriveGroupTitle, extractGroupKeyFromPattern } from './formatting';
import { matchesAnyPattern, splitPathSegments } from './match-pattern';

export type ArtefactType =
  | 'root'
  | 'script-file'
  | 'style-file'
  | 'entry-file'
  | 'static-import'
  | 'group';

const ARTEFACT_TYPE_ICON_MAP: Record<ArtefactType, string> = {
  root: '🗂️',
  'script-file': '📄',
  'style-file': '🎨',
  'entry-file': '📍',
  'static-import': '🔗',
  group: '📁',
};

const DEFAULT_GROUP_NAME = 'Group';

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

export { ARTEFACT_TYPE_ICON_MAP };

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

export function extractIntelligentGroupKey(
  filePath: string,
  patterns: readonly string[],
  maxDepth: number,
): string {
  const pathParts = splitPathSegments(filePath);

  const simpleGroupKey = pathParts.slice(0, maxDepth).join('/');

  for (const pattern of patterns) {
    const patternKey = extractGroupKeyFromPattern(filePath, pattern, maxDepth);
    if (patternKey) {
      return patternKey;
    }
  }

  return simpleGroupKey;
}

export function checkForScopedPackages(paths: string[]): string | null {
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

export function findCommonPath(paths: string[]): string {
  if (paths.length === 0) return DEFAULT_GROUP_NAME;
  if (paths.length === 1)
    return deriveGroupTitle(paths[0]!, [], DEFAULT_GROUP_NAME);

  const scopedPackagePattern = checkForScopedPackages(paths);
  if (scopedPackagePattern) {
    return scopedPackagePattern;
  }

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

    if (commonPath.includes('@*/') || commonPath.includes('*/')) {
      return DEFAULT_GROUP_NAME;
    }

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
      if (dir) {
        acc[dir] = (acc[dir] || 0) + 1;
      }
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
 * Determines if a tree node represents a dependency based on its path and children paths.
 * Checks node name and recursively examines children for dependency indicators.
 */
function isNodeDependency(
  node: TreeNode,
  dependencyPatterns: string[],
): boolean {
  // Check the node itself
  if (matchesAnyDependencyPattern(node.name, dependencyPatterns)) {
    return true;
  }

  // For group nodes, check if majority of children are dependencies
  if (node.type === 'group' && node.children.length > 0) {
    const dependencyChildren = node.children.filter(child =>
      isNodeDependency(child, dependencyPatterns),
    );

    // If more than 50% of children are dependencies, consider the whole group as dependency
    return dependencyChildren.length > node.children.length / 2;
  }

  // Check if any child paths indicate this is a dependency
  return node.children.some(child =>
    isNodeDependency(child, dependencyPatterns),
  );
}

/**
 * Checks if a file path matches common dependency patterns like node_modules, vendor libs, etc.
 * Uses efficient pattern matching to identify external dependencies vs source code.
 */
function matchesAnyDependencyPattern(
  path: string,
  patterns: string[],
): boolean {
  // Quick checks for common dependency indicators
  if (
    path.includes('node_modules/') ||
    path.includes('@') ||
    path.includes('vendor/') ||
    path.includes('lib/') ||
    path.includes('dist/lib/')
  ) {
    return true;
  }

  // Check against specific patterns
  return patterns.some(pattern =>
    matchesAnyPattern(path, [pattern], {
      matchBase: true,
      normalizeRelativePaths: true,
    }),
  );
}

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

        pathGroups.forEach((nodesInGroup, groupPath) => {
          const totalBytes = nodesInGroup.reduce(
            (sum, node) => sum + node.bytes,
            0,
          );
          const totalSources = nodesInGroup.reduce(
            (sum, node) => sum + node.sources,
            0,
          );

          let folderIcon = icon || ARTEFACT_TYPE_ICON_MAP['group'];
          let folderTitle = groupPath;

          const nodeChildrenPaths = nodesInGroup.flatMap(node => {
            const paths = [node.name];
            const collectChildPaths = (n: TreeNode): string[] => {
              const childPaths = [n.name];
              if (n.children && n.children.length > 0) {
                for (const child of n.children) {
                  childPaths.push(...collectChildPaths(child));
                }
              }
              return childPaths;
            };
            return collectChildPaths(node);
          });

          let bestRule: GroupingRule | null = null;
          let bestSpecificity = -1;

          for (const childPath of nodeChildrenPaths) {
            for (let i = groups.length - 1; i >= 0; i--) {
              const rule = groups[i];
              if (
                rule &&
                rule.patterns &&
                matchesAnyPattern(childPath, rule.patterns, {
                  matchBase: true,
                  normalizeRelativePaths: true,
                }) &&
                rule.patterns !== patterns &&
                (rule.icon || rule.title)
              ) {
                const specificity = rule.patterns.reduce((score, pattern) => {
                  if (pattern.includes('/packages/themepark/'))
                    return score + 100;
                  if (pattern.includes('/packages/vanilla/'))
                    return score + 100;
                  if (pattern.includes('/packages/design-system/'))
                    return score + 100;
                  if (pattern.includes('/packages/')) return score + 50;
                  if (rule.title) return score + 25;
                  return score;
                }, 0);

                if (specificity > bestSpecificity) {
                  bestRule = rule;
                  bestSpecificity = specificity;
                }
              }
            }
          }

          if (bestRule) {
            const hasExplicitTitle = Boolean(bestRule.title);
            const hasSpecificPatterns = bestRule.patterns.some(
              pattern =>
                pattern.includes('/packages/') || pattern.split('/').length > 3,
            );
            const isMoreSpecific =
              !icon || hasExplicitTitle || hasSpecificPatterns;

            if (isMoreSpecific) {
              folderIcon = bestRule.icon || ARTEFACT_TYPE_ICON_MAP['group'];
              folderTitle = bestRule.title || groupPath;
            }
          }

          const folderNode: TreeNode = {
            name: folderTitle,
            bytes: totalBytes,
            sources: totalSources,
            type: 'group',
            children: nodesInGroup,
            icon: folderIcon,
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
            patterns,
            'Dependencies',
          );

          if (
            effectiveTitle === 'Dependencies' ||
            effectiveTitle.includes('*')
          ) {
            effectiveTitle = findCommonPath(
              nodesToGroup.map(node => node.name),
            );

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
