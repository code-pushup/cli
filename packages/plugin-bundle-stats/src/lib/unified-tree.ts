import type { BasicTree, BasicTreeNode } from '../../../models/src/lib/tree.js';
import {
  formatBytes,
  truncateText,
} from '../../../utils/src/lib/formatting.js';
import { formatAsciiTree } from '../../../utils/src/lib/text-formats/ascii/tree';

/**
 * Replaces all occurrences of process.cwd() with <CWD> in a string and truncates long paths
 */
export const scrubPaths = (str: string): string => {
  const scrubbed = str.replace(
    new RegExp(process.cwd().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
    '<CWD>',
  );

  // Truncate long paths in the middle (50 chars max)
  return scrubbed.replace(
    /([^\s]*\/[^\s]*)/g, // Match path-like strings
    match =>
      match.length > 50
        ? truncateText(match, { maxChars: 50, position: 'middle' })
        : match,
  );
};

/**
 * Renders bundle stats tree as ASCII tree with path scrubbing
 */
export const renderBundleStatsTree = (
  bundleStatsTree: BasicTree,
  options: {
    sort?: boolean;
    takeFirst?: number;
    takeFirstLevel?: number;
    filterByPath?: (path: string) => boolean;
    filterBySize?: (bytes: number) => boolean;
  } = {},
): string => {
  let processedTree = options.sort
    ? sortTree(bundleStatsTree)
    : bundleStatsTree;

  // Apply filters and limits
  if (options.filterByPath || options.filterBySize || options.takeFirst) {
    processedTree = processTree(processedTree, options);
  }

  // Format byte values for display
  const displayTree = formatTreeForDisplay(processedTree);

  const asciiTree = formatAsciiTree(displayTree);
  return scrubPaths(asciiTree);
};

/**
 * Processes the tree by applying filters and limits
 */
export function processTree(
  tree: BasicTree,
  options: {
    takeFirst?: number;
    takeFirstLevel?: number;
    filterByPath?: (path: string) => boolean;
    filterBySize?: (bytes: number) => boolean;
  },
): BasicTree {
  return {
    ...tree,
    root: processTreeNode(tree.root, options, 0),
  };
}

/**
 * Processes a tree node by applying filters and limits
 */
function processTreeNode(
  node: BasicTreeNode,
  options: {
    takeFirst?: number;
    takeFirstLevel?: number;
    filterByPath?: (path: string) => boolean;
    filterBySize?: (bytes: number) => boolean;
  },
  depth: number,
): BasicTreeNode {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  let filteredChildren = node.children;

  // Apply filters
  if (options.filterByPath || options.filterBySize) {
    filteredChildren = filteredChildren.filter(child => {
      // Filter by path
      if (options.filterByPath && !options.filterByPath(child.name)) {
        return false;
      }

      // Filter by size
      if (options.filterBySize) {
        const bytes = child.values?.['bytes']
          ? parseInt(child.values['bytes'] as string, 10)
          : 0;
        if (!options.filterBySize(bytes)) {
          return false;
        }
      }

      return true;
    });
  }

  // Remove "inputs" section completely
  filteredChildren = filteredChildren.filter(child => child.name !== 'inputs');

  // Flatten "outputs" - replace outputs node with its children
  const outputsIndex = filteredChildren.findIndex(
    child => child.name === 'outputs',
  );
  if (outputsIndex !== -1) {
    const outputsNode = filteredChildren[outputsIndex];
    if (
      outputsNode &&
      outputsNode.children &&
      outputsNode.children.length > 0
    ) {
      // Replace the outputs node with its children
      filteredChildren.splice(outputsIndex, 1, ...outputsNode.children);
    }
  }

  // Apply takeFirst limit if we're within the specified levels
  if (options.takeFirst && typeof options.takeFirst === 'number') {
    const takeFirstLevel = options.takeFirstLevel ?? 2; // Default to 2 levels

    if (depth < takeFirstLevel) {
      filteredChildren = filteredChildren.slice(0, options.takeFirst);
    }
  }

  // Recursively process children
  const processedChildren = filteredChildren.map(child =>
    processTreeNode(child, options, depth + 1),
  );

  return {
    ...node,
    children: processedChildren,
  };
}

export function sortTree(tree: BasicTree): BasicTree {
  return {
    ...tree,
    root: sortTreeNode(tree.root),
  };
}

function sortTreeNode(node: BasicTreeNode): BasicTreeNode {
  if (!node.children || node.children.length === 0) {
    return node;
  }

  // Recursively sort children
  const sortedChildren = node.children.map(sortTreeNode).sort((a, b) => {
    // Special handling for bundle stats structure

    // Keep inputs/outputs grouping at top level
    if (a.name === 'inputs' && b.name === 'outputs') return -1;
    if (a.name === 'outputs' && b.name === 'inputs') return 1;

    // Keep dependency arrows (→) and contribution arrows (←) with their parent files
    const aIsArrow = a.name.startsWith('→ ') || a.name.startsWith('← ');
    const bIsArrow = b.name.startsWith('→ ') || b.name.startsWith('← ');

    if (aIsArrow && bIsArrow) {
      // For arrows, sort by the byte size of what they reference if available
      const aBytes = a.values?.['bytes']
        ? parseInt(a.values['bytes'] as string, 10)
        : 0;
      const bBytes = b.values?.['bytes']
        ? parseInt(b.values['bytes'] as string, 10)
        : 0;

      if (aBytes !== bBytes) {
        return bBytes - aBytes; // Larger contributions first
      }

      // Fallback to alphabetical by the file they reference
      const aFile = a.name.substring(2);
      const bFile = b.name.substring(2);
      return aFile.localeCompare(bFile);
    }

    if (aIsArrow && !bIsArrow) return 1; // Arrows come after regular files
    if (!aIsArrow && bIsArrow) return -1; // Regular files come before arrows

    // Primary sort: by size (bytes) descending
    const aBytes = a.values?.['bytes']
      ? parseInt(a.values['bytes'] as string, 10)
      : 0;
    const bBytes = b.values?.['bytes']
      ? parseInt(b.values['bytes'] as string, 10)
      : 0;

    if (aBytes !== bBytes) {
      return bBytes - aBytes; // Larger files first
    }

    // Secondary sort: alphabetical by name
    return a.name.localeCompare(b.name);
  });

  return {
    ...node,
    children: sortedChildren,
  };
}

/**
 * Formats byte values in the tree for display
 */
function formatTreeForDisplay(tree: BasicTree): BasicTree {
  return {
    ...tree,
    root: formatNodeForDisplay(tree.root),
  };
}

/**
 * Formats byte values in a tree node for display
 */
function formatNodeForDisplay(node: BasicTreeNode): BasicTreeNode {
  const formattedValues = { ...node.values };

  // Format bytes value if it exists
  if (formattedValues['bytes']) {
    const bytes = parseInt(formattedValues['bytes'] as string, 10);
    if (!isNaN(bytes)) {
      formattedValues['bytes'] = formatBytes(bytes);
    }
  }

  return {
    ...node,
    values: formattedValues,
    children: node.children?.map(formatNodeForDisplay) || [],
  };
}
