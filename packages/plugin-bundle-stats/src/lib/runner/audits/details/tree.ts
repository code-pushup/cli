import type { BasicTree, BasicTreeNode } from '@code-pushup/models';
import { formatBytes, truncateText } from '@code-pushup/utils';
import type { GroupingRule } from '../../types';
import type { UnifiedStats } from '../../unify/unified-stats.types';
import {
  type StatsTreeNode,
  applyGrouping as applyGroupingAndSort,
} from './grouping';
import type { StatsNodeValues } from './types';

/**
 * Helper type that transforms picked properties by adding "Display" suffix and making them strings.
 */
export type AddDisplaySuffix<T> = {
  [K in keyof T as `${string & K}Display`]: string;
};

/**
 * Display values for StatsTreeNode with formatted strings.
 */
export type StatsTreeNodeDisplayValues = AddDisplaySuffix<
  Pick<StatsNodeValues, 'bytes' | 'modules' | 'path'>
>;

export type FormattedStatsTreeNode = {
  name: string;
  values?: Record<string, string | number>;
  children: FormattedStatsTreeNode[];
};

/**
 * Display tree structure for bundle statistics output.
 */
export interface FormattedStatsTree {
  root: FormattedStatsTreeNode;
}

export const DEFAULT_PRUNING_OPTIONS: Required<PruningOptions> = {
  maxDepth: 4,
  maxChildren: 15,
  minSize: 0,
  pathLength: 60,
  startDepth: 1,
} as const;

export const DEFAULT_PATH_LENGTH = 40;

// Simple performance optimization: single cache for formatted strings
const STRING_FORMAT_CACHE = new Map<string, string>();

export interface ArtefactTreeOptions {
  groups?: GroupingRule[];
  pruning?: PruningOptions;
}

export interface PruningOptions {
  maxChildren?: number;
  maxDepth?: number;
  startDepth?: number;
  minSize?: number;
  pathLength?: number | false;
}

export interface PruneTreeNode {
  children: StatsTreeNode[];
}

/**
 * Converts statistics to tree structure. Streamlined for speed.
 */
export function convertStatsToTree(stats: UnifiedStats): StatsTreeNode[] {
  const artifacts = Object.values(stats);
  const result: StatsTreeNode[] = [];

  for (const artefact of artifacts) {
    const isEntry = Boolean(artefact.entryPoint);
    let inputNodes: StatsTreeNode[] = [];

    if (artefact.inputs) {
      const validInputs: StatsTreeNode[] = [];

      for (const [path, input] of Object.entries(artefact.inputs)) {
        if (input.bytes > 0) {
          validInputs.push({
            name: path,
            values: {
              path,
              bytes: input.bytes,
              modules: 1,
              type: 'static-import',
            },
            children: [],
          });
        }
      }

      if (validInputs.length > 1) {
        validInputs.sort((a, b) => b.values.bytes - a.values.bytes);
      }
      inputNodes = validInputs;
    }

    result.push({
      name: artefact.path,
      values: {
        path: artefact.path,
        bytes: artefact.bytes,
        modules: inputNodes.length,
        type: isEntry ? 'entry-file' : 'static-import',
      },
      children: inputNodes,
    });
  }

  if (result.length > 1) {
    result.sort((a, b) => b.values.bytes - a.values.bytes);
  }

  return result;
}

/**
 * Fast string formatting with simple caching.
 */
function formatNodeString(
  name: string,
  bytes: number,
  modules: number,
  icon: string,
  maxChars: number,
): string {
  const cacheKey = `${name}|${bytes}|${modules}|${maxChars}`;
  let cached = STRING_FORMAT_CACHE.get(cacheKey);

  if (!cached) {
    const truncatedName =
      maxChars < name.length
        ? truncateText(name, { maxChars, position: 'middle' })
        : name;

    const sizeDisplay =
      bytes > 0
        ? ` (${formatBytes(bytes)}${modules > 1 ? `, ${modules} modules` : ''})`
        : '';

    cached = `${icon} ${truncatedName}${sizeDisplay}`;

    // Simple cache size management
    if (STRING_FORMAT_CACHE.size < 20000) {
      STRING_FORMAT_CACHE.set(cacheKey, cached);
    }
  }

  return cached;
}

/**
 * Formats tree nodes with clean names and separate values for proper alignment.
 */
export function formatStatsTreeForDisplay(
  node: StatsTreeNode,
  pathLength: number | false = DEFAULT_PATH_LENGTH,
): FormattedStatsTreeNode {
  const maxChars = pathLength !== false ? pathLength : DEFAULT_PATH_LENGTH;

  // Clean name truncation (no icons or size info)
  const cleanName =
    maxChars < node.name.length
      ? truncateText(node.name, { maxChars, position: 'middle' })
      : node.name;

  // Fast icon resolution
  let icon = node.values.icon;
  if (!icon) {
    switch (node.values.type) {
      case 'entry-file':
        icon = '📍';
        break;
      case 'group':
        icon = '📁';
        break;
      case 'root':
        icon = '🗂️';
        break;
      default:
        icon = '📄';
        break;
    }
  }

  // Recurse through children (keep it simple - recursion is fast in JS)
  const children = node.children.map(child =>
    formatStatsTreeForDisplay(child, pathLength),
  );

  return {
    name: `${icon} ${cleanName}`, // Clean name with just icon
    values: {
      size: formatBytes(node.values.bytes),
      ...(node.values.modules > 1 && {
        modules: `${node.values.modules} modules`,
      }),
    },
    children,
  };
}

/**
 * Converts FormattedStatsTreeNode to BasicTreeNode for proper ASCII display.
 */
function formattedStatsTreeNodeToBasicTreeNode(
  node: FormattedStatsTreeNode,
): BasicTreeNode {
  return {
    name: node.name,
    ...(node.values && { values: node.values }),
    ...(node.children.length > 0 && {
      children: node.children.map(formattedStatsTreeNodeToBasicTreeNode),
    }),
  };
}

/**
 * Creates artifact tree with focused optimizations.
 */
export function createTree(
  statsSlice: UnifiedStats,
  options: { title: string } & Required<ArtefactTreeOptions>,
): BasicTree {
  const { title, groups, pruning } = options;

  // Simple cache management
  if (STRING_FORMAT_CACHE.size > 25000) {
    STRING_FORMAT_CACHE.clear();
  }

  let nodes = convertStatsToTree(statsSlice);

  // Apply grouping if needed
  if (groups?.length && nodes.length) {
    for (const node of nodes) {
      if (node.children.length > 0) {
        node.children = applyGroupingAndSort(node.children, groups);
      }
    }
  }

  // Efficient pruning
  const prunedRoot = pruneTree(
    { children: nodes },
    {
      ...DEFAULT_PRUNING_OPTIONS,
      ...pruning,
    },
  );

  const prunedNodes = prunedRoot.children;

  // Calculate totals
  let totalBytes = 0;
  let totalModules = 0;
  for (const node of prunedNodes) {
    totalBytes += node.values.bytes;
    totalModules += node.values.modules;
  }

  // Format nodes
  const formattedChildren = prunedNodes.map(node =>
    formatStatsTreeForDisplay(node, pruning.pathLength),
  );

  const formattedRoot: FormattedStatsTreeNode = {
    name: `🗂️ ${title}`,
    values: {
      'total size': formatBytes(totalBytes),
      ...(totalModules > 1 && { 'total modules': totalModules }),
      files: prunedNodes.length,
    },
    children: formattedChildren,
  };

  // Convert to BasicTree for proper ASCII display
  const root = formattedStatsTreeNodeToBasicTreeNode(formattedRoot);

  return {
    type: 'basic',
    title,
    root,
  };
}

function pruneTree(
  rootNode: PruneTreeNode,
  options: Required<PruningOptions>,
): PruneTreeNode {
  const { maxChildren, maxDepth, startDepth = 0, minSize } = options;

  // Start from 1 so that maxDepth: 2 stops at package level, maxDepth: 3 shows individual files
  return pruneTreeRecursive(rootNode, options, 1);
}

function pruneTreeRecursive(
  node: PruneTreeNode,
  options: Required<PruningOptions>,
  currentDepth: number,
): PruneTreeNode {
  const { maxChildren, maxDepth, minSize } = options;

  if (node.children.length === 0) {
    return node;
  }

  // Sort children by size (largest first)
  if (node.children.length > 1) {
    node.children.sort((a, b) => b.values.bytes - a.values.bytes);
  }

  // Apply maxChildren and minSize filtering at all levels within maxDepth
  const keptChildren: StatsTreeNode[] = [];
  const groupedChildren: StatsTreeNode[] = [];

  for (const child of node.children) {
    if (child.values.bytes >= minSize) {
      // Recursively prune child's subtree if within maxDepth
      const prunedChild =
        currentDepth < maxDepth
          ? pruneTreeRecursive(
              { children: child.children },
              options,
              currentDepth + 1,
            )
          : { children: [] };

      keptChildren.push({
        ...child,
        children: prunedChild.children,
      });
    } else {
      // Collect small files for grouping
      groupedChildren.push(child);
    }
  }

  // Apply maxChildren limit - move overflow to grouped items
  let finalChildren = keptChildren;
  if (keptChildren.length > maxChildren) {
    const kept = keptChildren.slice(0, maxChildren);
    const overflow = keptChildren.slice(maxChildren);

    // Add overflow files to the grouped items
    groupedChildren.push(...overflow);
    finalChildren = kept;
  }

  // Create empty "..." group if we have items to represent
  if (groupedChildren.length > 0) {
    const totalBytes = groupedChildren.reduce(
      (sum, child) => sum + child.values.bytes,
      0,
    );
    const totalModules = groupedChildren.reduce(
      (sum, child) => sum + child.values.modules,
      0,
    );

    const moreNode = {
      name: '...',
      values: {
        path: '',
        bytes: totalBytes,
        modules: totalModules,
        type: 'group' as const,
        icon: '📁',
      },
      children: [], // Empty - just represents the grouped items
    };

    finalChildren.push(moreNode);
  }

  return { children: finalChildren };
}
