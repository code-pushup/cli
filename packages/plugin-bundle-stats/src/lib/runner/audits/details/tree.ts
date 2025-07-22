import { formatBytes, truncateText } from '@code-pushup/utils';
import type { GroupingRule } from '../../types';
import type { UnifiedStats } from '../../unify/unified-stats.types';
import {
  type StatsTreeNode,
  applyGrouping as applyGroupingAndSort,
  getFileIcon,
} from './utils/grouping-engine';
import type { ArtefactType, StatsNodeValues } from './utils/types';

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
  Pick<StatsNodeValues, 'bytes' | 'sources' | 'path'>
>;

export type FormattedStatsTreeNode = Omit<
  StatsTreeNode,
  'values' | 'children'
> &
  Pick<StatsNodeValues, 'bytes' | 'sources' | 'path'> & {
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
 * Converts statistics to tree structure. Creates initial tree nodes from unified statistics.
 */
export function convertStatsToTree(stats: UnifiedStats): StatsTreeNode[] {
  const artifacts = Object.values(stats);

  // Process all artifacts in a single pass using reduce
  const { entryFiles, externalImports } = artifacts.reduce(
    (acc, artefact) => {
      const isEntry = Boolean(artefact.entryPoint);

      // Create input nodes using map instead of for loop
      const inputNodes = artefact.inputs
        ? Object.entries(artefact.inputs).map(([path, input]) => ({
            name: path,
            values: {
              path: path,
              bytes: input.bytes,
              sources: 1,
              type: 'static-import' as const,
            },
            children: [],
          }))
        : [];

      const artefactNode: StatsTreeNode = {
        name: artefact.path,
        values: {
          path: artefact.path,
          bytes: artefact.bytes,
          sources: 1 + inputNodes.length,
          type: isEntry ? 'entry-file' : 'static-import',
        },
        children: inputNodes,
      };

      // Add to appropriate array based on entry type
      if (isEntry) {
        acc.entryFiles.push(artefactNode);
      } else {
        acc.externalImports.push(artefactNode);
      }

      return acc;
    },
    {
      entryFiles: [] as StatsTreeNode[],
      externalImports: [] as StatsTreeNode[],
    },
  );

  return [...entryFiles, ...externalImports];
}

/**
 * Formats tree nodes for display with icons and truncated names. Handles intelligent icon assignment.
 */
export function formatStatsTree(
  node: StatsTreeNode,
  pathLength: number | false = DEFAULT_PATH_LENGTH,
): FormattedStatsTreeNode {
  let icon: string;

  if (node.values.icon) {
    // Use provided icon if available
    icon = node.values.icon;
  } else {
    // Determine icon based on type and path
    let artefactType: ArtefactType;

    if (node.values.type === 'entry-file') {
      artefactType = 'entry-file';
    } else if (node.values.type === 'group') {
      artefactType = 'group';
    } else if (node.values.type === 'root') {
      artefactType = 'root';
    } else {
      artefactType = 'static-import';
    }

    icon = getFileIcon(artefactType, node.values.path);
  }

  const maxChars = pathLength !== false ? pathLength : DEFAULT_PATH_LENGTH;
  const name = truncateText(node.name, { maxChars, position: 'middle' });

  // Format bytes for display
  const sizeDisplay =
    node.values.bytes > 0
      ? ` (${formatBytes(node.values.bytes)}${node.values.sources > 1 ? `, ${node.values.sources} sources` : ''})`
      : '';

  const children: FormattedStatsTreeNode[] = [];
  for (const child of node.children) {
    children.push(formatStatsTree(child, pathLength));
  }

  return {
    name: `${icon} ${name}${sizeDisplay}`,
    bytes: node.values.bytes,
    sources: node.values.sources,
    path: node.values.path,
    children,
  };
}

/**
 * Creates artifact tree with grouping applied to inputs only. Groups source files and dependencies while preserving output structure.
 */
export function createTree(
  statsSlice: UnifiedStats,
  options: { title: string } & Required<ArtefactTreeOptions>,
): FormattedStatsTree {
  const { title, groups, pruning } = options;

  let nodes: StatsTreeNode[] = convertStatsToTree(statsSlice);

  // Apply grouping only to inputs (children), not to outputs (top-level nodes)
  if (groups && groups.length > 0) {
    nodes = nodes.map(node => ({
      ...node,
      children: applyGroupingAndSort(node.children, groups),
    }));
  }

  const prunedRoot = pruneTree(
    { children: nodes },
    {
      ...DEFAULT_PRUNING_OPTIONS,
      ...pruning,
    },
    true,
  );

  const prunedNodes = prunedRoot.children;

  const totalBytes = prunedNodes.reduce(
    (acc, node) => acc + node.values.bytes,
    0,
  );
  const totalSources = prunedNodes.reduce(
    (acc, node) => acc + node.values.sources,
    0,
  );

  const root: FormattedStatsTreeNode = {
    name: `🗂️ ${title}`,
    bytes: totalBytes,
    sources: totalSources,
    path: '',
    children: prunedNodes.map(node =>
      formatStatsTree(node, pruning.pathLength),
    ),
  };

  return { root };
}

/**
 * Prunes tree by filtering nodes and limiting children. Optimizes tree structure for display.
 */
export function pruneTree(
  node: PruneTreeNode,
  options: Required<PruningOptions>,
  isAlreadySorted = false,
): PruneTreeNode {
  const { maxChildren, maxDepth, startDepth = 0, minSize } = options;
  const { children } = node;

  if (!isAlreadySorted) {
    node.children.sort((a, b) => b.values.bytes - a.values.bytes);
  }

  // Filter by minimum size (inlined from filterByMinSizeSinglePass)
  const filteredChildren: StatsTreeNode[] = [];
  const belowThreshold: StatsTreeNode[] = [];

  for (const child of node.children) {
    if (child.values.bytes >= minSize) {
      filteredChildren.push(child);
    } else {
      belowThreshold.push(child);
    }
  }

  if (belowThreshold.length > 0) {
    let aggregatedBytes = 0;
    let aggregatedSources = 0;

    for (const child of belowThreshold) {
      aggregatedBytes += child.values.bytes;
      aggregatedSources += child.values.sources;
    }

    const summaryNode: StatsTreeNode = {
      name: `... ${belowThreshold.length} files more`,
      values: {
        path: '',
        bytes: aggregatedBytes,
        sources: aggregatedSources,
        type: 'group',
      },
      children: [],
    };

    node.children = [...filteredChildren, summaryNode];
  } else {
    node.children = filteredChildren;
  }

  if (children.length > maxChildren) {
    const keptChildren = children.slice(0, maxChildren);
    const removedChildren = children.slice(maxChildren);

    let remainingBytes = 0;
    let remainingSources = 0;

    for (const child of removedChildren) {
      remainingBytes += child.values.bytes;
      remainingSources += child.values.sources;
    }

    keptChildren.push({
      name: `... ${removedChildren.length} more`,
      values: {
        path: '',
        bytes: remainingBytes,
        sources: remainingSources,
        type: 'group',
      },
      children: [],
    });

    node.children = keptChildren;
  }

  const nextDepth = startDepth + 1;
  if (nextDepth <= maxDepth) {
    const prunedChildren: StatsTreeNode[] = [];

    for (const child of node.children) {
      const prunedChild = pruneTree(
        { children: child.children },
        {
          maxChildren,
          maxDepth,
          startDepth: nextDepth,
          minSize,
          pathLength: options.pathLength,
        },
        true,
      );
      const updatedChild: StatsTreeNode = {
        ...child,
        children: prunedChild.children,
      };
      prunedChildren.push(updatedChild);
    }

    node.children = prunedChildren;
  } else {
    node.children = [];
  }

  return node;
}
