import type { BasicTree, BasicTreeNode } from '@code-pushup/models';
import { formatBytes, pluralizeToken, truncateText } from '@code-pushup/utils';
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

export const DEFAULT_PRUNING_CONFIG: Required<PruningConfig> = {
  maxDepth: 4,
  maxChildren: 15,
  minSize: 0,
  pathLength: 60,
  startDepth: 1,
} as const;

export const DEFAULT_PATH_LENGTH = 40;

// Simple performance optimization: single cache for formatted strings
const STRING_FORMAT_CACHE = new Map<string, string>();

export interface DependencyTreeConfig {
  groups?: GroupingRule[] | false;
  pruning?: PruningConfig;
  enabled?: boolean;
}

export interface PruningConfig {
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
 * Flattens single-child groups to reduce hierarchy and applies group icons to actual files.
 */
function flattenSingleChildGroups(nodes: StatsTreeNode[]): StatsTreeNode[] {
  return nodes.map(node => {
    // If this is a group with exactly one child, flatten it
    if (node.values.type === 'group' && node.children.length === 1) {
      const child = node.children[0]!;

      // Use the group's icon for the child file
      return {
        ...child,
        values: {
          ...child.values,
          icon: node.values.icon || '📦', // Use group icon or default package icon
        },
        children: flattenSingleChildGroups(child.children), // Recursively flatten children
      };
    }

    // For other nodes, just recursively process children
    return {
      ...node,
      children: flattenSingleChildGroups(node.children),
    };
  });
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

  const values: Record<string, string | number> = {};

  // Show size for all nodes except intermediate nodes in single-child chains
  // This means: entry files, groups with multiple children, and leaf files all show size
  if (node.children.length !== 1) {
    values['size'] = formatBytes(node.values.bytes);
  }

  // Only show source count if more than 1 source
  if (node.values.modules > 1) {
    values['modules'] = pluralizeToken('source', node.values.modules);
  }

  return {
    name: `${icon} ${cleanName}`, // Clean name with just icon
    values,
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
  options: { title: string } & DependencyTreeConfig,
): BasicTree {
  const { title, groups, pruning } = options;

  // Simple cache management
  if (STRING_FORMAT_CACHE.size > 25000) {
    STRING_FORMAT_CACHE.clear();
  }

  let nodes = convertStatsToTree(statsSlice);

  // Apply grouping if needed
  if (Array.isArray(groups) && groups.length && nodes.length) {
    // Apply grouping only to inputs (children) within each output file
    // Don't group the output files themselves
    for (const node of nodes) {
      if (node.children.length > 0) {
        node.children = applyGroupingAndSort(node.children, groups);
      }
    }

    // Flatten single-child groups after applying grouping
    nodes = flattenSingleChildGroups(nodes);
  }

  // Efficient pruning
  const prunedRoot = pruneTree(
    { children: nodes },
    {
      ...DEFAULT_PRUNING_CONFIG,
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
    formatStatsTreeForDisplay(node, pruning?.pathLength),
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

export function pruneTree(
  rootNode: PruneTreeNode,
  options: Required<PruningConfig>,
): PruneTreeNode {
  const { maxChildren, maxDepth, startDepth = 0, minSize } = options;

  // Start from 1 so that maxDepth: 2 stops at package level, maxDepth: 3 shows individual files
  return pruneTreeRecursive(rootNode, options, 1);
}

function pruneTreeRecursive(
  node: PruneTreeNode,
  options: Required<PruningConfig>,
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

  // Create "..." group if we have multiple items to represent, or show single item directly
  if (groupedChildren.length > 0) {
    if (groupedChildren.length === 1) {
      // If there's only one grouped item, show it directly instead of creating "..." group
      finalChildren.push(groupedChildren[0]!);
    } else {
      // Multiple items - create "..." group
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
  }

  return { children: finalChildren };
}
