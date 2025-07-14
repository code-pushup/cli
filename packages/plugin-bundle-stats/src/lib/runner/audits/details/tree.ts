import type { BasicTree, BasicTreeNode } from '@code-pushup/models';
import { formatBytes, pluralizeToken } from '@code-pushup/utils';
import type { GroupingRule } from '../../types';
import type {
  UnifiedStats,
  UnifiedStatsInput,
  UnifiedStatsOutput,
} from '../../unify/unified-stats.types';
import {
  deriveGroupTitle,
  findCommonPath,
  matchesAnyPattern,
} from '../match-pattern';

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

export interface ArtefactTreeOptions {
  groups?: GroupingRule[];
  pruning?: PruningOptions;
}

export interface PruningOptions {
  maxChildren?: number;
  maxDepth?: number;
  startDepth?: number;
}

export const DEFAULT_PRUNING = {
  maxDepth: 3,
  maxChildren: 5,
};

const ARTEFACT_TYPE_ICON_MAP: Record<ArtefactType, string> = {
  root: '🗂️',
  'script-file': '📄',
  'style-file': '🎨',
  'entry-file': '📍',
  'static-import': '🔗',
  group: '📁',
};

function formatFileCount(count: number): string {
  if (count === 0) {
    return '';
  }
  return pluralizeToken('source', count);
}

function formatPath(path: string, maxLength: number): string {
  if (path.length <= maxLength) {
    return path;
  }
  const parts = path.split('/');
  if (parts.length > 3) {
    return `${parts[0]}/.../${parts.slice(-2).join('/')}`;
  }
  return path;
}

function getArtefactType(artefact: UnifiedStatsOutput): ArtefactType {
  if (artefact.path.endsWith('.css') || artefact.path.endsWith('.scss')) {
    return 'style-file';
  }
  if (artefact.path.endsWith('.js') || artefact.path.endsWith('.ts')) {
    return artefact.entryPoint ? 'entry-file' : 'script-file';
  }
  return 'script-file';
}

function convertToTree(stats: UnifiedStats): TreeNode[] {
  const root: TreeNode = { name: 'root', children: [], bytes: 0, sources: 0 };

  Object.values(stats).forEach((artefact: UnifiedStatsOutput) => {
    const artefactNode: TreeNode = {
      name: artefact.path,
      bytes: artefact.bytes,
      sources: 1,
      type: getArtefactType(artefact),
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

    root.children.push(artefactNode);
    root.bytes += artefactNode.bytes;
    root.sources += artefactNode.sources;
  });

  return root.children;
}

function applyGrouping(nodes: TreeNode[], groups: GroupingRule[]): TreeNode[] {
  if (!groups || groups.length === 0) {
    return nodes;
  }

  const newNodes = nodes.map(node => ({
    ...node,
    children: applyGrouping(node.children, groups),
  }));

  let finalNodes = [...newNodes];

  for (const group of [...groups].reverse()) {
    const { title, patterns, icon } = group;

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
      // When user provides explicit title, use it for all matching nodes
      // When no title is provided, find the common path segment among all matching files
      const effectiveTitle =
        title || findCommonPath(nodesToGroup.map(node => node.name));

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

      remainingNodes.push(groupNode);
    }

    finalNodes = remainingNodes;
  }

  return finalNodes;
}

function pruneTree(
  node: TreeNode,
  options: Required<PruningOptions>,
): TreeNode {
  const { maxChildren, maxDepth, startDepth = 0 } = options;
  
  // Sort children by bytes in descending order before pruning
  node.children.sort((a, b) => b.bytes - a.bytes);
  
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
      pruneTree(child, { maxDepth, maxChildren, startDepth: startDepth + 1 }),
    );

  return node;
}

function toBasicTreeNode(node: TreeNode): BasicTreeNode {
  const icon = node.icon || ARTEFACT_TYPE_ICON_MAP[node.type || 'script-file'];
  const name = node.name; // formatPath(node.name, 40);
  const size = formatBytes(node.bytes);
  const sources = formatFileCount(node.sources);

  const formattedSize = size;
  const formattedSources =
    node.children.length > 0 || node.sources > 1 ? `${sources}` : '';

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
 * - `📁` - Group
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
  
  // Sort nodes by bytes in descending order at the root level
  nodes.sort((a, b) => b.bytes - a.bytes);

  const tempRoot: TreeNode = {
    name: 'temp-root',
    bytes: 0,
    sources: 0,
    children: nodes,
  };
  const prunedNodes = pruneTree(tempRoot, {
    ...DEFAULT_PRUNING,
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
      sources: pluralizeToken('source', totalSources),
    },
    children: prunedNodes.map(toBasicTreeNode),
  };

  return {
    root,
  };
}
