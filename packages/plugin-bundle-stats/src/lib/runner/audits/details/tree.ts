import type { BasicTree, BasicTreeNode } from '@code-pushup/models';
import { formatBytes, pluralize, truncateText } from '@code-pushup/utils';
import type { GroupingRule } from '../../types';
import type {
  UnifiedStats,
  UnifiedStatsBundle,
  UnifiedStatsInput,
} from '../../unify/unified-stats.types';
import { ARTEFACT_TYPE_ICON_MAP, DEFAULT_PRUNING_OPTIONS } from './constants';
import {
  applyGrouping,
  findCommonPath,
  separateSourcesAndDependencies,
} from './utils/grouping';
import type { ArtefactType, Node, TreeNode } from './utils/grouping';

export interface ArtefactTreeOptions {
  groups?: GroupingRule[];
  pruning?: PruningOptions;
}

export interface PruningOptions {
  maxChildren?: number;
  maxDepth?: number;
  startDepth?: number;
  minSize?: number;
}

function convertToTree(stats: UnifiedStats): TreeNode[] {
  const root: TreeNode = { name: 'root', children: [], bytes: 0, sources: 0 };
  const entryFiles: TreeNode[] = [];
  const externalImports: TreeNode[] = [];

  Object.values(stats).forEach((artefact: UnifiedStatsBundle) => {
    // Check if this is an entry file
    if (artefact.entryPoint) {
      const entryName = artefact.path;
      const artefactNode: TreeNode = {
        name: entryName,
        bytes: artefact.bytes,
        sources: 1,
        type: 'entry-file',
        children: [],
      };

      if (artefact.inputs) {
        const inputs: [string, UnifiedStatsInput][] = Object.entries(
          artefact.inputs,
        );
        artefactNode.sources += inputs.length;

        // Create input nodes - these will be the source files
        artefactNode.children = inputs.map(
          ([path, input]: [string, UnifiedStatsInput]) => ({
            name: path,
            bytes: input.bytes,
            sources: 1,
            type: 'script-file' as ArtefactType,
            children: [],
          }),
        );
      }

      entryFiles.push(artefactNode);
    } else {
      // This is an external import/chunk
      const artefactNode: TreeNode = {
        name: artefact.path,
        bytes: artefact.bytes,
        sources: 1,
        type: 'script-file',
        children: [],
      };

      if (artefact.inputs) {
        const inputs: [string, UnifiedStatsInput][] = Object.entries(
          artefact.inputs,
        );
        artefactNode.sources += inputs.length;
        artefactNode.children = inputs.map(
          ([path, input]: [string, UnifiedStatsInput]) => ({
            name: path,
            bytes: input.bytes,
            sources: 1,
            type: 'script-file',
            children: [],
          }),
        );
      }

      externalImports.push(artefactNode);
    }
  });

  // Combine entry files and external imports as siblings
  const allNodes = [...entryFiles, ...externalImports];

  allNodes.forEach(node => {
    root.bytes += node.bytes;
    root.sources += node.sources;
  });

  return allNodes;
}

function filterByMinSize(children: TreeNode[], minSize: number): TreeNode[] {
  const filteredChildren = children.filter(child => child.bytes >= minSize);
  const belowThreshold = children.filter(child => child.bytes < minSize);

  if (belowThreshold.length > 0) {
    const aggregatedBytes = belowThreshold.reduce(
      (acc: number, child: TreeNode) => acc + child.bytes,
      0,
    );
    const aggregatedSources = belowThreshold.reduce(
      (acc: number, child: TreeNode) => acc + child.sources,
      0,
    );

    const summaryNode: TreeNode = {
      name: `... ${belowThreshold.length} files more`,
      bytes: aggregatedBytes,
      sources: aggregatedSources,
      children: [],
      type: 'group',
    };

    return [...filteredChildren, summaryNode];
  }

  return filteredChildren;
}

function pruneTree(
  node: TreeNode,
  options: Required<PruningOptions>,
): TreeNode {
  const { maxChildren, maxDepth, startDepth = 0, minSize } = options;

  // Sort children by bytes in descending order before pruning
  node.children.sort((a, b) => b.bytes - a.bytes);

  // Apply minimum size filtering
  node.children = filterByMinSize(node.children, minSize);

  if (node.children.length > maxChildren) {
    const remainingChildren = node.children.slice(maxChildren);
    const remainingBytes = remainingChildren.reduce(
      (acc: number, child: TreeNode) => acc + child.bytes,
      0,
    );
    const remainingSources = remainingChildren.reduce(
      (acc: number, child: TreeNode) => acc + child.sources,
      0,
    );

    node.children = node.children.slice(0, maxChildren);
    node.children.push({
      name: `... ${remainingChildren.length} more`,
      bytes: remainingBytes,
      sources: remainingSources,
      children: [],
      type: 'group',
    });
  }

  // Filter out children that would exceed maxDepth and recursively prune the rest
  node.children = node.children
    .filter((child, index) => {
      const childDepth = startDepth + 1;
      return childDepth <= maxDepth;
    })
    .map((child: TreeNode) =>
      pruneTree(child, {
        maxDepth,
        maxChildren,
        startDepth: startDepth + 1,
        minSize,
      }),
    );

  return node;
}

function toBasicTreeNode(node: TreeNode): BasicTreeNode {
  const icon = node.icon || ARTEFACT_TYPE_ICON_MAP[node.type || 'script-file'];
  const name = truncateText(node.name, {
    maxChars: 40,
    position: 'middle',
  });
  const size = formatBytes(node.bytes);

  const formattedSize = size;
  const formattedSources =
    node.children.length > 0 || node.sources > 1
      ? `${node.sources} ${pluralize('source', node.sources)}`
      : '';

  return {
    name: `${icon} ${name}`,
    values: {
      size: formattedSize,
      sources: formattedSources,
    },
    children: node.children.map(toBasicTreeNode),
  };
}

/**
 * Converts unified bundler stats into a `BasicTree`, applying grouping, pruning, and formatting.
 * Provides a hierarchical and human-readable view of bundle artefacts for easier analysis in reports.
 *
 * ## Artefact Tree
 * Each group is displayed as a tree of artefacts, inputs, and static imports.
 *
 * ### Artefact Types
 * The following types are detected:
 * - `📄` - Script file (JS/TS)
 * - `🎨` - Style file (CSS/SCSS)
 * - `📍` - Entry file (JS/TS)
 * - `��` - Group
 *
 * ### Artefact Inputs & Imports
 * Inputs are listed under each chunk. Static imports that contribute to the size are listed as siblings.
 * This helps to understand the true size of an artefact group and where its dependencies come from.
 *
 * ### Artefact Grouping
 * Artefact inputs can be grouped based on user configuration (`patterns`, `title`, `icon`).
 *
 * ### Tree Pruning
 * The tree can be pruned to reduce information overload using `maxChildren` and `maxDepth` options.
 *
 * ### Formatting
 * - **Size**: Formatted to the nearest unit (e.g., kB, MB).
 * - **Sources**: Pluralized (e.g., "1 source", "2 sources").
 * - **Path**: Shortened for readability.
 * - **Redundancy**: Source counts are omitted for single-source nodes.
 *
 */
export function createTree(
  statsSlice: UnifiedStats,
  options: { title: string } & Required<ArtefactTreeOptions>,
): BasicTree {
  const { title, groups, pruning } = options;
  let nodes = convertToTree(statsSlice);
  nodes = applyGrouping(nodes, groups);
  nodes = separateSourcesAndDependencies(nodes, groups);

  // Sort nodes by bytes in descending order at the root level
  nodes.sort((a, b) => b.bytes - a.bytes);

  const tempRoot: TreeNode = {
    name: 'temp-root',
    bytes: 0,
    sources: 0,
    children: nodes,
  };
  const prunedNodes = pruneTree(tempRoot, {
    ...DEFAULT_PRUNING_OPTIONS,
    ...options?.pruning,
    startDepth: 0,
  }).children;

  const totalBytes = prunedNodes.reduce(
    (acc: number, curr: TreeNode) => acc + curr.bytes,
    0,
  );
  const totalSources = prunedNodes.reduce(
    (acc: number, curr: TreeNode) => acc + curr.sources,
    0,
  );

  const root: BasicTreeNode = {
    name: `🗂️ ${title}`,
    values: {
      size: formatBytes(totalBytes),
      sources: `${totalSources} ${pluralize('source', totalSources)}`,
    },
    children: prunedNodes.map(toBasicTreeNode),
  };

  return {
    root,
  };
}
