import { minimatch } from 'minimatch';
import { formatBytes } from '@code-pushup/utils';
import { type GroupingRule } from '../types.js';
import type { BundleStatsNode, GroupNode } from './bundle-stats.types.js';

export interface PrunedNode {
  name: string;
  values?: {
    displayBytes?: string;
    displayFiles?: string;
  };
  children?: PrunedNode[];
}

export interface StructuralNode {
  name: string;
  values?: {
    bytes?: number;
    fileCount?: number;
  };
  children?: StructuralNode[];
}

export interface PruneOptions {
  maxChildren?: number;
  depth?: number;
  maxDepth?: number;
}

interface CachedNode {
  node: BundleStatsNode;
  bytes: number;
  fileCount: number;
}

interface GroupInfo {
  name: string;
  nodes: CachedNode[];
  totalBytes: number;
  totalFiles: number;
  icon: string;
}

export function prune(
  node: BundleStatsNode,
  options: PruneOptions = {},
): StructuralNode {
  const { maxChildren = 5, depth = 0, maxDepth = 2 } = options;

  const nodeBytes = node.values.bytes || 0;
  const fileCount = (node.values as any).childCount || 1;

  const head: StructuralNode = {
    name: node.name,
    values: {
      bytes: nodeBytes,
      fileCount: fileCount,
    },
  };

  if (depth >= maxDepth || !node.children?.length) return head;

  // Process children recursively
  const processedChildren = node.children.slice(0, maxChildren).map(child => {
    return prune(child, {
      maxChildren,
      depth: depth + 1,
      maxDepth,
    });
  });

  // Add "more" indicator if there are additional children
  const hasMoreChildren = node.children.length > maxChildren;
  if (hasMoreChildren) {
    const remainingCount = node.children.length - maxChildren;
    const moreNode: StructuralNode = {
      name: `... and ${remainingCount} more item${remainingCount !== 1 ? 's' : ''}`,
    };
    processedChildren.push(moreNode);
  }

  return { ...head, children: processedChildren };
}

export function formatTree(
  node: StructuralNode,
  suppressDisplayBytes: boolean = false,
): PrunedNode {
  const nodeBytes = node.values?.bytes || 0;
  const fileCount = node.values?.fileCount || 0;

  // Don't show display bytes/files if suppressed (for single children that would produce duplicate info)
  const displayBytes = suppressDisplayBytes
    ? undefined
    : nodeBytes > 0
      ? formatBytes(nodeBytes)
      : undefined;

  const displayFiles = suppressDisplayBytes
    ? undefined
    : fileCount > 0
      ? formatDisplayFiles(fileCount)
      : undefined;

  const head: PrunedNode = {
    name: node.name,
    values:
      displayBytes || displayFiles
        ? {
            ...(displayBytes && { displayBytes }),
            ...(displayFiles && { displayFiles }),
          }
        : undefined,
  };

  if (!node.children?.length) return head;

  const hasOnlyOneChild = node.children.length === 1;

  const processedChildren = node.children.map(child => {
    const childBytes = child.values?.bytes || 0;
    const childFileCount = child.values?.fileCount || 0;
    const shouldSuppress =
      hasOnlyOneChild &&
      childBytes === nodeBytes &&
      childFileCount === fileCount;

    return formatTree(child, shouldSuppress);
  });

  return { ...head, children: processedChildren };
}

/**
 * Applies grouping to a tree structure without pruning, for use before sorting
 */
export function applyGroupingToTree(
  node: BundleStatsNode,
  options: { grouping?: GroupingRule[]; depth?: number } = {},
): BundleStatsNode {
  const { grouping = [], depth = 0 } = options;

  if (!node.children?.length) return node;

  const cachedChildren = node.children.map(cachifyNode);

  const { groups, ungrouped } = groupByRules(cachedChildren, grouping, depth);

  const groupedNodes: BundleStatsNode[] = groups.map(group => {
    return {
      name: group.name,
      values: {
        type: 'group' as const,
        bytes: group.totalBytes,
        path: group.name,
        childCount: group.totalFiles,
        icon: group.icon,
      },
      children: group.nodes.map(cached =>
        applyGroupingToTree(cached.node, { grouping, depth: depth + 1 }),
      ),
    } satisfies GroupNode;
  });

  // Process ungrouped nodes recursively
  const ungroupedNodes = ungrouped.map(cached =>
    applyGroupingToTree(cached.node, { grouping, depth: depth + 1 }),
  );

  return {
    ...node,
    children: [...ungroupedNodes, ...groupedNodes],
  };
}

function cachifyNode(node: BundleStatsNode): CachedNode {
  const nodeBytes = node.values.bytes || 0;
  const fileCount = (node.values as any).childCount || 1;
  return { node, bytes: nodeBytes, fileCount };
}

function formatDisplayFiles(fileCount: number): string {
  return `${fileCount} file${fileCount !== 1 ? 's' : ''}`;
}

function groupByRules(
  cachedChildren: CachedNode[],
  groupingRules: GroupingRule[],
  depth: number,
): { groups: GroupInfo[]; ungrouped: CachedNode[] } {
  const groupMap = new Map<
    string,
    { nodes: CachedNode[]; rule: GroupingRule }
  >();
  const ungrouped: CachedNode[] = [];

  for (const cached of cachedChildren) {
    const rule = findMatchingRule(cached.node, groupingRules, depth);
    if (rule) {
      const groupName = extractGroupName(cached.node, rule);
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, { nodes: [], rule });
      }
      groupMap.get(groupName)!.nodes.push(cached);
    } else {
      ungrouped.push(cached);
    }
  }

  const groups = Array.from(groupMap.entries()).map(([name, { nodes, rule }]) =>
    createGroupInfo(name, nodes, rule),
  );

  return { groups, ungrouped };
}

function createGroupInfo(
  name: string,
  nodes: CachedNode[],
  rule: GroupingRule,
): GroupInfo {
  const totalBytes = nodes.reduce((sum, { bytes }) => sum + bytes, 0);
  const totalFiles = nodes.reduce((sum, { fileCount }) => sum + fileCount, 0);
  const icon = rule.icon || '📦';
  return { name, nodes, totalBytes, totalFiles, icon };
}

function findMatchingRule(
  node: BundleStatsNode,
  rules: GroupingRule[],
  depth: number,
): GroupingRule | null {
  const path = node.values.path || '';
  const name = node.name || '';

  return (
    rules.find(
      rule =>
        (rule.depth === undefined || rule.depth === depth) &&
        rule.patterns.some(pattern =>
          [path, name]
            .filter(Boolean)
            .some(testPath => minimatch(testPath, pattern)),
        ),
    ) || null
  );
}

function extractGroupName(node: BundleStatsNode, rule: GroupingRule): string {
  const path = node.values.path || '';
  const ruleName = rule.name;

  // If the rule name doesn't contain wildcards, return it as-is
  if (!ruleName.includes('*')) {
    return ruleName;
  }

  // Find which pattern matched the path
  const matchingPattern = rule.patterns.find(pattern =>
    minimatch(path, pattern),
  );

  if (!matchingPattern) {
    return ruleName;
  }

  // Extract the relevant segment from the path based on the rule template
  const extractedSegment = extractSegmentFromPath(
    path,
    matchingPattern,
    ruleName,
  );

  if (!extractedSegment) {
    return ruleName;
  }

  // Special handling for @*/* rule with regular packages
  if (ruleName === '@*/*') {
    // Check if this is a regular package (doesn't contain '/')
    if (!extractedSegment.includes('/')) {
      // Return just the package name for regular packages
      return extractedSegment;
    }
    // For scoped packages, use the template
    return ruleName.replace(/\*/g, extractedSegment);
  }

  // Replace wildcards in the rule name with the extracted segment
  return ruleName.replace(/\*/g, extractedSegment);
}

/**
 * Extracts the relevant path segment based on the matching pattern and rule template
 */
function extractSegmentFromPath(
  path: string,
  pattern: string,
  ruleName: string,
): string | null {
  // Handle specific Angular patterns
  if (ruleName === '@angular/*' && pattern.includes('@angular')) {
    const match = path.match(/node_modules\/@angular\/([^\/]+)/);
    return match && match[1] ? match[1] : null;
  }

  // Handle packages patterns
  if (ruleName === 'packages/*' && pattern.includes('packages/')) {
    const match = path.match(/packages\/([^\/]+)/);
    return match && match[1] ? match[1] : null;
  }

  // Handle scoped package patterns like @*/* but only for actual scoped packages
  if (ruleName === '@*/*' && pattern.includes('node_modules')) {
    // Check if this is actually a scoped package
    const scopedMatch = path.match(/node_modules\/(@[^\/]+\/[^\/]+)/);
    if (scopedMatch && scopedMatch[1]) {
      // For @scope/package, extract just the scope and package separately
      const fullScopedName = scopedMatch[1];
      const parts = fullScopedName.split('/');
      if (parts.length === 2) {
        // Return just the scope name without @ and the package name
        return `${parts[0]!.substring(1)}/${parts[1]!}`;
      }
    }

    // For regular packages that don't start with @, return just the package name
    const regularMatch = path.match(/node_modules\/([^\/]+)/);
    if (regularMatch && regularMatch[1] && !regularMatch[1].startsWith('@')) {
      return regularMatch[1];
    }

    return null;
  }

  // For other patterns, try to extract the first meaningful segment
  if (pattern.includes('node_modules')) {
    // Try scoped packages first
    const scopedMatch = path.match(/node_modules\/(@[^\/]+\/[^\/]+)/);
    if (scopedMatch && scopedMatch[1]) {
      return scopedMatch[1];
    }

    // Then try regular packages
    const regularMatch = path.match(/node_modules\/([^\/]+)/);
    if (regularMatch && regularMatch[1]) {
      return regularMatch[1];
    }
  }

  return null;
}

export function calcTotals(node: BundleStatsNode): BundleStatsNode {
  // Safety check for undefined node
  if (!node || !node.values) {
    throw new Error('calcTotals: Invalid node provided');
  }

  if (!node.children || node.children.length === 0) {
    // Leaf node - return as is
    return node;
  }

  // Recursively calculate totals for all children first, filtering out any undefined nodes
  const calculatedChildren = node.children
    .filter(child => child && child.values) // Filter out invalid children
    .map(child => calcTotals(child));

  // Calculate totals from children
  const totalBytes = calculatedChildren.reduce((sum, child) => {
    return sum + (child.values?.bytes || 0);
  }, 0);

  const totalFiles = calculatedChildren.reduce((sum, child) => {
    return sum + (child.values?.childCount || 1);
  }, 0);

  // Return node with updated totals, maintaining the original type
  return {
    ...node,
    values: {
      ...node.values,
      bytes: totalBytes,
      childCount: totalFiles,
    } as typeof node.values,
    children: calculatedChildren,
  } as BundleStatsNode;
}
