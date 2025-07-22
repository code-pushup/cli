import type { BasicTree, BasicTreeNode } from '@code-pushup/models';
import { formatBytes, pluralize, truncateText } from '@code-pushup/utils';
import type { GroupingRule } from '../../types';
import type { UnifiedStats } from '../../unify/unified-stats.types';
import {
  ARTEFACT_TYPE_ICON_MAP,
  type TreeNode,
  applyGrouping,
  separateSourcesAndDependencies,
} from './utils/tree-utils';

const DEFAULT_PRUNING_OPTIONS: Required<PruningOptions> = {
  maxDepth: 4,
  maxChildren: 15,
  minSize: 0,
  pathLength: 60,
  startDepth: 1,
} as const;

export { DEFAULT_PRUNING_OPTIONS };

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

const formatCache = new Map<number, string>();
const truncateCache = new Map<string, string>();

function cachedTruncateText(text: string, maxChars: number): string {
  const cacheKey = `${text}:${maxChars}`;
  let truncated = truncateCache.get(cacheKey);
  if (!truncated) {
    truncated = truncateText(text, { maxChars, position: 'middle' });
    truncateCache.set(cacheKey, truncated);
  }
  return truncated;
}

export function clearTreeCaches(): void {
  formatCache.clear();
  truncateCache.clear();
}

function convertToTree(stats: UnifiedStats): TreeNode[] {
  const entryFiles: TreeNode[] = [];
  const externalImports: TreeNode[] = [];

  for (const [, artefact] of Object.entries(stats)) {
    const isEntry = artefact.entryPoint;
    const targetArray = isEntry ? entryFiles : externalImports;

    const artefactNode: TreeNode = {
      name: artefact.path,
      bytes: artefact.bytes,
      sources: 1,
      type: isEntry ? 'entry-file' : 'script-file',
      children: [],
    };

    if (artefact.inputs) {
      const inputEntries = Object.entries(artefact.inputs);
      artefactNode.sources += inputEntries.length;

      const inputNodes: TreeNode[] = [];
      for (const [path, input] of inputEntries) {
        inputNodes.push({
          name: path,
          bytes: input.bytes,
          sources: 1,
          type: 'script-file',
          children: [],
        });
      }
      artefactNode.children = inputNodes;
    }

    targetArray.push(artefactNode);
  }

  return [...entryFiles, ...externalImports];
}

/**
 * Prunes tree by filtering nodes and limiting children. Optimizes tree structure for display.
 */
function pruneTree(
  node: Pick<TreeNode, 'children'>,
  options: Required<PruningOptions>,
  isAlreadySorted = false,
): Pick<TreeNode, 'children'> {
  const { maxChildren, maxDepth, startDepth = 0, minSize } = options;
  const { children } = node;

  if (!isAlreadySorted) {
    node.children.sort((a, b) => b.bytes - a.bytes);
  }

  // Filter by minimum size (inlined from filterByMinSizeSinglePass)
  const filteredChildren: TreeNode[] = [];
  const belowThreshold: TreeNode[] = [];

  for (const child of node.children) {
    if (child.bytes >= minSize) {
      filteredChildren.push(child);
    } else {
      belowThreshold.push(child);
    }
  }

  if (belowThreshold.length > 0) {
    let aggregatedBytes = 0;
    let aggregatedSources = 0;

    for (const child of belowThreshold) {
      aggregatedBytes += child.bytes;
      aggregatedSources += child.sources;
    }

    const summaryNode: TreeNode = {
      name: `... ${belowThreshold.length} files more`,
      bytes: aggregatedBytes,
      sources: aggregatedSources,
      children: [],
      type: 'group',
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
      remainingBytes += child.bytes;
      remainingSources += child.sources;
    }

    keptChildren.push({
      name: `... ${removedChildren.length} more`,
      bytes: remainingBytes,
      sources: remainingSources,
      children: [],
      type: 'group',
    });

    node.children = keptChildren;
  }

  const nextDepth = startDepth + 1;
  if (nextDepth <= maxDepth) {
    const prunedChildren: TreeNode[] = [];

    for (const child of node.children) {
      const prunedChild = pruneTree(
        child,
        {
          maxChildren,
          maxDepth,
          startDepth: nextDepth,
          minSize,
          pathLength: options.pathLength,
        },
        true,
      );
      prunedChildren.push(prunedChild as TreeNode);
    }

    node.children = prunedChildren;
  } else {
    node.children = [];
  }

  return node;
}

export const DEFAULT_PATH_LENGTH = 40;

function formatSelectionAsTree(
  node: TreeNode,
  pathLength: number | false = DEFAULT_PATH_LENGTH,
): BasicTreeNode {
  const icon = node.icon || ARTEFACT_TYPE_ICON_MAP[node.type || 'script-file'];

  const maxChars = pathLength !== false ? pathLength : DEFAULT_PATH_LENGTH;
  const name = cachedTruncateText(node.name, maxChars);
  const size = formatBytes(node.bytes);

  const formattedSources =
    node.children.length > 0 || node.sources > 1
      ? `${node.sources} ${pluralize('source', node.sources)}`
      : '';

  const children: BasicTreeNode[] = [];
  for (const child of node.children) {
    children.push(formatSelectionAsTree(child, pathLength));
  }

  return {
    name: `${icon} ${name}`,
    values: {
      size,
      sources: formattedSources,
    },
    children,
  };
}

export function createTree(
  statsSlice: UnifiedStats,
  options: { title: string } & Required<ArtefactTreeOptions>,
): BasicTree {
  const { title, groups, pruning } = options;

  let nodes = convertToTree(statsSlice);
  nodes = applyGrouping(nodes, groups);

  const prunedRoot = pruneTree(
    { children: nodes },
    {
      ...DEFAULT_PRUNING_OPTIONS,
      ...pruning,
    },
    true,
  );

  const prunedNodes = prunedRoot.children;

  const totalBytes = prunedNodes.reduce((acc, node) => acc + node.bytes, 0);
  const totalSources = prunedNodes.reduce((acc, node) => acc + node.sources, 0);

  const root: BasicTreeNode = {
    name: `🗂️ ${title}`,
    values: {
      size: formatBytes(totalBytes),
      sources: `${totalSources} ${pluralize('source', totalSources)}`,
    },
    children: prunedNodes.map(node =>
      formatSelectionAsTree(node, pruning.pathLength),
    ),
  };

  return { root };
}
