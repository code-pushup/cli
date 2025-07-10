import type { AuditOutput } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';
import type { BundleStatsConfig } from './types.js';
import type {
  BundleStatsNode,
  BundleStatsTree,
  ChunkNode,
  SupportedImportKind,
} from './unify/bundle-stats.types.js';
import { filterTreeNode } from './utils/match-artefacts.js';

const BUNDLE_CONTRIBUTING_IMPORT_KINDS = new Set<SupportedImportKind>([
  'static',
]);

function contributesToBundleSize(
  node: BundleStatsNode,
  allowedImportTypes: Set<SupportedImportKind> = BUNDLE_CONTRIBUTING_IMPORT_KINDS,
): boolean {
  const type = node.values.type;
  if (!type) return true;

  if (type === 'import') {
    if (node.values.importKind === 'static') {
      return true;
    }
    if (node.values.importKind === 'dynamic') {
      return false;
    }
    return allowedImportTypes.has(node.values.importKind);
  }

  return true;
}

function groupImportedChunksByParent(root: BundleStatsNode): BundleStatsNode {
  if (!root.children) return root;

  const newChildren: BundleStatsNode[] = [];
  const importGroupsPerParent: Array<{
    parentName: string;
    chunks: BundleStatsNode[];
  }> = [];

  // Instead of creating an extra grouping layer, directly add all children to newChildren
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

      // Add the child directly to newChildren (no extra grouping layer)
      newChildren.push({
        ...child,
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
 * Filters a bundle stats tree based on a single configuration
 */
export function filterUnifiedTreeByConfigSingle(
  bundleStatsTree: BundleStatsTree,
  config: BundleStatsConfig,
): BundleStatsTree | null {
  // Filter the tree based on current config
  const filteredRoot = filterTreeNode(
    bundleStatsTree.root,
    [...(config.include || [])], // Convert readonly array to mutable array
    contributesToBundleSize,
    BUNDLE_CONTRIBUTING_IMPORT_KINDS,
  );

  if (!filteredRoot) {
    return null;
  }

  // Group imported chunks under "imported from main" for better organization
  // const restructuredRoot = groupImportedChunksByParent(filteredRoot);

  // For now, skip the grouping to get a cleaner structure
  const restructuredRoot = filteredRoot;

  // Update the root name to use the audit slug
  const rootWithAuditSlug = {
    ...restructuredRoot,
    name: config.slug, // Use the audit slug as the root name
  };

  // Create a new tree with the config name as title
  return {
    title: config.title || config.slug,
    type: 'basic',
    root: rootWithAuditSlug,
  };
}

export function createDisplayValue(
  totalBytes: number,
  fileCount: number,
): string {
  const fileCountText = fileCount === 1 ? '1 file' : `${fileCount} files`;
  return `${formatBytes(totalBytes)} (${fileCountText})`;
}

export function formatTreeForDisplay(node: any, title: string): any {
  return {
    title,
    root: formatTreeNodeForDisplay(node),
  };
}

export function formatTreeNodeForDisplay(node: any): any {
  const result: any = {
    name: node.name,
  };

  if (node.values) {
    result.values = {};
    if (node.values.displayBytes) {
      result.values.displayBytes = node.values.displayBytes;
    }
    if (node.values.displayFiles) {
      result.values.displayFiles = node.values.displayFiles;
    }
  }

  if (node.children && node.children.length > 0) {
    result.children = node.children.map(formatTreeNodeForDisplay);
  }

  return result;
}

export function createEmptyAudit(config: BundleStatsConfig): AuditOutput {
  return {
    slug: config.slug,
    score: 1,
    value: 0,
    displayValue: '0 B',
    details: {
      trees: [],
    },
  };
}
