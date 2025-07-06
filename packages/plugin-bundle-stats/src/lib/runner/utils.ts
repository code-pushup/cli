import { minimatch } from 'minimatch';
import type {
  BundleStatsNode,
  BundleStatsTree,
  ChunkNode,
  SupportedImportKind,
} from '../processing/bundle-stats.visitor.js';
import type { BundleStatsConfig } from './types.js';

export interface ProcessedBundleData {
  total: number;
  rootNode: BundleStatsNode;
}

export interface ProcessedBundleDataWithConfig {
  config: BundleStatsConfig;
  total: number;
  rootNode: BundleStatsNode;
}

/**
 * Import kinds that contribute to actual bundle size
 */
const BUNDLE_CONTRIBUTING_IMPORT_KINDS = new Set<SupportedImportKind>([
  'static', // Static imports reference chunks that are part of the current bundle
]);
const DEFAULT_THRESHOLD_BYTES = 1024 * 1024; // 1MB

/**
 * Checks if a node represents an import that contributes to bundle size
 */
function contributesToBundleSize(
  node: BundleStatsNode,
  allowedImportTypes: Set<SupportedImportKind> = BUNDLE_CONTRIBUTING_IMPORT_KINDS,
): boolean {
  const type = node.values.type;
  if (!type) return true; // Include structural nodes without type

  if (type === 'import') {
    // Static imports contribute to bundle size as they reference included chunks
    // Dynamic imports are separate bundles loaded on-demand and don't contribute to current bundle size
    if (node.values.importKind === 'static') {
      return true;
    }
    if (node.values.importKind === 'dynamic') {
      return false;
    }
    // For other import kinds, use the allowedImportTypes set
    return allowedImportTypes.has(node.values.importKind);
  }

  return true; // Include chunk, input, and asset nodes
}

/**
 * Checks if node matches any of the include patterns
 */
function matchesIncludePatterns(
  node: BundleStatsNode,
  includePatterns: string[],
): boolean {
  if (includePatterns.length === 0) return true;

  // Get all possible paths to check against patterns
  const pathsToCheck = [
    node.name,
    ...(node.values.path ? [node.values.path] : []),
  ].filter(Boolean);

  // Separate positive and negative patterns
  const positivePatterns = includePatterns.filter(p => !p.startsWith('!'));
  const negativePatterns = includePatterns
    .filter(p => p.startsWith('!'))
    .map(p => p.slice(1)); // Remove the '!' prefix

  // If no positive patterns, assume everything matches initially
  const matchesPositive =
    positivePatterns.length === 0 ||
    positivePatterns.some(pattern =>
      pathsToCheck.some(path => minimatch(path, pattern)),
    );

  // Check if any negative patterns exclude this file
  const matchesNegative = negativePatterns.some(pattern =>
    pathsToCheck.some(path => minimatch(path, pattern)),
  );

  // Include if matches positive patterns AND doesn't match negative patterns
  return matchesPositive && !matchesNegative;
}

/**
 * Filters nodes based on include patterns and import types
 */
function filterTreeNode(
  node: BundleStatsNode,
  includePatterns: string[],
  allowedImportTypes: Set<SupportedImportKind> = BUNDLE_CONTRIBUTING_IMPORT_KINDS,
  isTopLevel: boolean = true,
): BundleStatsNode | null {
  // Check if current node matches include patterns (only at top level)
  const matchesPatterns = isTopLevel
    ? matchesIncludePatterns(node, includePatterns)
    : true;

  // Check if this node is explicitly excluded by negation patterns
  const isExplicitlyExcluded =
    isTopLevel && !matchesPatterns && includePatterns.length > 0;

  // Check if this node contributes to bundle size
  const contributes = contributesToBundleSize(node, allowedImportTypes);

  // Check if patterns are looking for node_modules content
  const isLookingForNodeModules = includePatterns.some(pattern =>
    pattern.includes('node_modules'),
  );

  // Filter children recursively
  const filteredChildren: BundleStatsNode[] = [];
  if (node.children) {
    for (const child of node.children) {
      // Apply pattern matching in these cases:
      // 1. For bundle node, apply to its chunk children
      // 2. When looking for node_modules, also apply to children inside chunks
      // 3. For other nodes: once inside a matched chunk, include all contributing children
      const shouldUsePatterns =
        (isTopLevel &&
          (node.values.type !== 'chunk' || node.name === 'bundle')) ||
        (isLookingForNodeModules && node.values.type === 'chunk');

      const filteredChild = filterTreeNode(
        child,
        includePatterns,
        allowedImportTypes,
        shouldUsePatterns,
      );
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    }
  }

  // Include node if:
  // 1. At top level: matches patterns AND contributes to bundle size, OR
  // 2. Not at top level: contributes to bundle size, OR
  // 3. It has filtered children AND is NOT explicitly excluded by negation patterns, OR
  // 4. It's a structural node (like 'bundle', 'inputs', 'outputs')
  const isStructuralNode = ['bundle', 'inputs', 'outputs'].includes(node.name);

  const shouldInclude = isTopLevel
    ? (matchesPatterns && contributes) ||
      isStructuralNode ||
      (filteredChildren.length > 0 && !isExplicitlyExcluded)
    : contributes || filteredChildren.length > 0 || isStructuralNode;

  if (shouldInclude) {
    return {
      ...node,
      children: filteredChildren.length > 0 ? filteredChildren : undefined,
    } as BundleStatsNode;
  }

  return null;
}

/**
 * Groups imported chunks under "imported from <parent>" groups for any parent that has import children
 */
function groupImportedChunksByParent(root: BundleStatsNode): BundleStatsNode {
  if (!root.children) return root;

  const newChildren: BundleStatsNode[] = [];
  const importGroupsPerParent: Array<{
    parentName: string;
    chunks: BundleStatsNode[];
  }> = [];

  for (const child of root.children) {
    if (child.children) {
      // Separate imported chunks from direct content
      const importedChunks: BundleStatsNode[] = [];
      const directContent: BundleStatsNode[] = [];

      for (const grandChild of child.children) {
        if (grandChild.values.type === 'import') {
          importedChunks.push(grandChild);
        } else {
          directContent.push(grandChild);
        }
      }

      // Calculate the size and file count for only direct content
      const directBytes = directContent.reduce((sum, node) => {
        return sum + (node.values.bytes || 0);
      }, 0);

      const directFiles = directContent.reduce((sum, node) => {
        return sum + (node.values.childCount || 1);
      }, 0);

      // Add parent with updated size to reflect only direct content
      newChildren.push({
        ...child,
        values: {
          ...child.values,
          bytes: directBytes,
          childCount: directFiles,
        },
        children: directContent.length > 0 ? directContent : undefined,
      } as BundleStatsNode);

      // If this parent has imported chunks, add them to the list for separate grouping
      if (importedChunks.length > 0) {
        importGroupsPerParent.push({
          parentName: child.name,
          chunks: importedChunks,
        });
      }
    } else {
      // Recursively process nodes with children
      newChildren.push(groupImportedChunksByParent(child));
    }
  }

  // Create separate import groups for each parent that has imports
  for (const { parentName, chunks } of importGroupsPerParent) {
    // Calculate total size and file count for this parent's imports
    const totalBytes = chunks.reduce((sum, chunk) => {
      return sum + (chunk.values.bytes || 0);
    }, 0);

    const totalFiles = chunks.reduce((sum, chunk) => {
      return sum + (chunk.values.childCount || 0);
    }, 0);

    // Determine the correct icon for the parent based on its type
    const parentIcon =
      parentName.includes('main') || parentName.includes('polyfills')
        ? '📍'
        : '📄';

    const importedGroup: BundleStatsNode = {
      name: `imported from ${parentIcon} ${parentName}`,
      values: {
        type: 'group',
        bytes: totalBytes,
        path: '',
        childCount: totalFiles,
        icon: '🔗',
      },
      children: chunks
        .map(
          chunk =>
            ({
              name: chunk.name, // Keep original chunk name without "imported from" prefix
              values: {
                type: 'chunk' as const,
                bytes: chunk.values.bytes || 0,
                path: chunk.values.path || '',
                childCount: chunk.values.childCount || 0,
              },
              children: chunk.children || [],
            }) satisfies ChunkNode,
        )
        .sort((a, b) => (b.values.bytes || 0) - (a.values.bytes || 0)), // Sort by size descending
    };

    newChildren.push(importedGroup);
  }

  return {
    ...root,
    children: newChildren,
  };
}

/**
 * Filters a bundle stats tree based on configuration and returns separate trees for each config
 */
export function filterUnifiedTreeByConfig(
  bundleStatsTree: BundleStatsTree,
  configs: BundleStatsConfig[],
): BundleStatsTree[] {
  const results: BundleStatsTree[] = [];

  for (const config of configs) {
    // Filter the tree based on current config
    const filteredRoot = filterTreeNode(
      bundleStatsTree.root,
      [...(config.include || [])], // Convert readonly array to mutable array
    );

    if (filteredRoot) {
      // Group imported chunks under "imported from main" for better organization
      const restructuredRoot = groupImportedChunksByParent(filteredRoot);

      // Create a new tree with the config name as title
      const filteredTree: BundleStatsTree = {
        title: config.title || config.slug,
        type: 'basic',
        root: restructuredRoot,
      };

      results.push(filteredTree);
    }
  }

  return results;
}

/**
 * Calculates the bundle score based on total size and threshold
 *
 * @param total - Total bundle size in bytes
 * @param config - Bundle configuration containing thresholds
 * @returns Score as a ratio (0-1) of actual size to threshold, capped at 1
 */
export function calculateScore(
  total: number,
  config: BundleStatsConfig,
): number {
  const maxTotal =
    config.thresholds?.total?.bytes?.[1] || DEFAULT_THRESHOLD_BYTES;
  // Cap the score at a maximum of 1 to prevent validation errors
  return Math.min(1, total / maxTotal);
}
