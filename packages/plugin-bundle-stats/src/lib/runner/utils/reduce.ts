import { minimatch } from 'minimatch';
import { formatBytes } from '@code-pushup/utils';
import { type GroupingRule, type PruningOptions } from '../types.js';
import type {
  BundleStatsNode,
  GroupNode,
} from '../unify/bundle-stats.types.js';

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
  options: PruningOptions = {},
): StructuralNode {
  const { maxChildren = 5, startDepth = 0, maxDepth = 2 } = options;

  const nodeBytes = node.values.bytes || 0;
  const fileCount = (node.values as any).childCount || 1;

  const head: StructuralNode = {
    name: node.name,
    values: {
      bytes: nodeBytes,
      fileCount: fileCount,
    },
  };

  if (startDepth >= maxDepth || !node.children?.length) return head;

  // Process children recursively
  const processedChildren = node.children.slice(0, maxChildren).map(child => {
    return prune(child, {
      maxChildren,
      startDepth: startDepth + 1,
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

/**
 * Groups external imports under dedicated import groups per file.
 * This helps understand the true size of your artifact group by showing:
 * - Input files with their bundled content as direct children
 * - Static imports groups for external imports that are not bundled
 * - Chunk-specific external imports groups at the root level
 *
 * Creates a structure like:
 * 🗂️ example-group                         237.17 kB   101 files
 * ├── 📍 entry-1.js                         138 kB    2 files
 * │   ├── 📄 src/input-1.ts                 101 kB
 * │   └── 📄 src/input-2.ts                  37 kB
 * ├── 📄 entry-2.js                          30 kB    2 files
 * │   ├── 📄 node_modules/@angular/router/provider.js
 * │   └── 📄 node_modules/@angular/router/service.js
 * ├── 🎨 styles.css                          14 kB
 * ├── 🔗 static imports from 📍 entry-1.js   104 kB
 * │   └── 📄 file-1.js
 * └── 🔗 external imports from 📍 entry-1.js
 *     ├── 📄 chunk-1.js
 *     └── 📄 chunk-2.js
 */
export function groupExternalImports(node: BundleStatsNode): BundleStatsNode {
  if (!node.children?.length) return node;

  // For root nodes, collect all external imports from all chunks
  if (
    node.values.type === 'group' &&
    node.children.some(child => child.values.type === 'chunk')
  ) {
    const processedChildren: BundleStatsNode[] = [];
    const allExternalImportGroups: BundleStatsNode[] = [];

    // Process each child (likely chunks)
    for (const child of node.children) {
      if (child.values.type === 'chunk') {
        // Process chunk and collect its external imports
        const { processedChunk, externalImports } =
          processChunkAndExtractExternalImports(child);
        processedChildren.push(processedChunk);

        // Create chunk-specific external imports group if there are any
        if (externalImports.length > 0) {
          const externalImportsGroup: BundleStatsNode = {
            name: `external imports from ${child.name}`,
            values: {
              type: 'group' as const,
              bytes: 0, // External imports don't contribute to bundle size
              path: 'external-imports',
              childCount: externalImports.length,
              icon: '🔗',
            },
            children: externalImports.map(imp => ({
              ...imp,
              name: imp.name.replace('imported from ▶ ', ''), // Remove the prefix
              values: {
                ...imp.values,
                type: 'input' as const, // Change type to show 📄 icon
              },
            })),
          };

          allExternalImportGroups.push(externalImportsGroup);
        }
      } else {
        // Process other types recursively
        processedChildren.push(groupExternalImports(child));
      }
    }

    // Add all external import groups at the end
    const finalChildren = [...processedChildren, ...allExternalImportGroups];

    return {
      ...node,
      children: finalChildren,
    };
  }

  // For chunk nodes, process input files but don't include external imports as children
  if (node.values.type === 'chunk') {
    const inputFiles: BundleStatsNode[] = [];
    const externalImportGroups: BundleStatsNode[] = [];

    // Get all bundled input paths for this chunk to distinguish bundled vs external imports
    const bundledInputPaths = new Set<string>();
    for (const child of node.children) {
      if (child.values.type === 'input') {
        bundledInputPaths.add(child.values.path);
      }
    }

    // Process each child of the chunk
    for (const child of node.children) {
      if (child.values.type === 'input') {
        // For input files, separate bundled content from external imports
        const bundledContent: BundleStatsNode[] = [];
        const externalImports: BundleStatsNode[] = [];

        if (child.children) {
          for (const importNode of child.children) {
            if (bundledInputPaths.has(importNode.values.path)) {
              // This import is also bundled into this chunk - show as bundled content
              bundledContent.push(groupExternalImports(importNode));
            } else {
              // This import is external to this chunk - collect for external imports group
              externalImports.push(groupExternalImports(importNode));
            }
          }
        }

        // Add the input file with bundled content as children
        inputFiles.push({
          ...child,
          children: bundledContent.length > 0 ? bundledContent : undefined,
        });

        // Create external imports group if there are external imports
        if (externalImports.length > 0) {
          const externalImportsBytes = externalImports.reduce((sum, imp) => {
            return sum + (imp.values?.bytes || 0);
          }, 0);

          const externalImportsCount = externalImports.reduce((sum, imp) => {
            return sum + (imp.values?.childCount || 1);
          }, 0);

          const externalImportsGroup: BundleStatsNode = {
            name: `static imports from ${child.name}`,
            values: {
              type: 'group' as const,
              bytes: externalImportsBytes,
              path: 'static-imports',
              childCount: externalImportsCount,
              icon: '🔗',
            },
            children: externalImports,
          };

          externalImportGroups.push(externalImportsGroup);
        }
      } else if (child.values.type === 'import') {
        // External imports (chunk dependencies) - these will be handled at root level
        // Skip them here, they'll be collected by processChunkAndExtractExternalImports
      } else {
        // Other types (groups, etc.) are bundled content - process recursively
        inputFiles.push(groupExternalImports(child));
      }
    }

    // Return chunk with only input files and external import groups (no chunk imports)
    return {
      ...node,
      children: [...inputFiles, ...externalImportGroups],
    };
  }

  // For all other nodes, just process children recursively
  const processedChildren = node.children.map(child =>
    groupExternalImports(child),
  );

  return {
    ...node,
    children: processedChildren,
  };
}

/**
 * Helper function to process a chunk and extract its external imports
 */
function processChunkAndExtractExternalImports(chunk: BundleStatsNode): {
  processedChunk: BundleStatsNode;
  externalImports: BundleStatsNode[];
} {
  if (!chunk.children?.length) {
    return { processedChunk: chunk, externalImports: [] };
  }

  const inputFiles: BundleStatsNode[] = [];
  const externalImportGroups: BundleStatsNode[] = [];
  const externalImports: BundleStatsNode[] = [];

  // Get all bundled input paths for this chunk
  const bundledInputPaths = new Set<string>();
  for (const child of chunk.children) {
    if (child.values.type === 'input') {
      bundledInputPaths.add(child.values.path);
    }
  }

  // Process each child of the chunk
  for (const child of chunk.children) {
    if (child.values.type === 'input') {
      // For input files, separate bundled content from external imports
      const bundledContent: BundleStatsNode[] = [];
      const childExternalImports: BundleStatsNode[] = [];

      if (child.children) {
        for (const importNode of child.children) {
          if (bundledInputPaths.has(importNode.values.path)) {
            // This import is also bundled into this chunk - show as bundled content
            bundledContent.push(groupExternalImports(importNode));
          } else {
            // This import is external to this chunk - collect for external imports group
            childExternalImports.push(groupExternalImports(importNode));
          }
        }
      }

      // Add the input file with bundled content as children
      inputFiles.push({
        ...child,
        children: bundledContent.length > 0 ? bundledContent : undefined,
      });

      // Create external imports group if there are external imports
      if (childExternalImports.length > 0) {
        const externalImportsBytes = childExternalImports.reduce((sum, imp) => {
          return sum + (imp.values?.bytes || 0);
        }, 0);

        const externalImportsCount = childExternalImports.reduce((sum, imp) => {
          return sum + (imp.values?.childCount || 1);
        }, 0);

        const externalImportsGroup: BundleStatsNode = {
          name: `static imports from ${child.name}`,
          values: {
            type: 'group' as const,
            bytes: externalImportsBytes,
            path: 'static-imports',
            childCount: externalImportsCount,
            icon: '🔗',
          },
          children: childExternalImports,
        };

        externalImportGroups.push(externalImportsGroup);
      }
    } else if (child.values.type === 'import') {
      // External imports (chunk dependencies) - collect for root level
      externalImports.push(groupExternalImports(child));
    } else {
      // Other types (groups, etc.) are bundled content - process recursively
      inputFiles.push(groupExternalImports(child));
    }
  }

  const processedChunk: BundleStatsNode = {
    ...chunk,
    children: [...inputFiles, ...externalImportGroups],
  };

  return { processedChunk, externalImports };
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
  const nodePath = node.values.path || node.name;

  for (const rule of rules) {
    if (rule.maxDepth !== undefined && rule.maxDepth !== depth) continue;
    if (
      rule.patterns.some((pattern: string) =>
        minimatch(nodePath, pattern, { matchBase: true }),
      )
    ) {
      return rule;
    }
  }
  return null;
}

function extractGroupName(node: BundleStatsNode, rule: GroupingRule): string {
  const nodePath = node.values.path || node.name;

  // For node_modules patterns, extract the package name
  if (rule.patterns.some(pattern => pattern.includes('node_modules'))) {
    // First try to match scoped packages like @angular/core
    const scopedMatch = nodePath.match(/node_modules\/(@[^\/]+\/[^\/]+)/);
    if (scopedMatch && scopedMatch[1]) {
      return scopedMatch[1];
    }

    // Then try regular packages like rxjs
    const regularMatch = nodePath.match(/node_modules\/([^\/]+)/);
    if (regularMatch && regularMatch[1]) {
      return regularMatch[1];
    }
  }

  // For packages patterns, extract the package name with trailing slash
  if (rule.patterns.some(pattern => pattern.includes('packages'))) {
    const match = nodePath.match(/packages\/([^\/]+)/);
    if (match && match[1]) {
      return match[1] + '/';
    }
  }

  // Fallback to rule title if no specific extraction works
  return rule.title;
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
