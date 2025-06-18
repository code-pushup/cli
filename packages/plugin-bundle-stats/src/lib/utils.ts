import { minimatch } from 'minimatch';
import type { BasicTree, BasicTreeNode } from '../../../models/src/lib/tree.js';

export interface BundleStatsConfig {
  name: string;
  include: string[];
  thresholds?: {
    percent?: number;
    bytes?: number;
  };
}

export interface BundleStatsNode extends BasicTreeNode {
  values?: {
    bytes?: string;
    imports?: string;
    files?: string;
    type?: string;
  };
  children?: BundleStatsNode[];
}

/**
 * Filters nodes from a unified tree based on include patterns
 */
function matchesIncludePatterns(
  nodeName: string,
  includePatterns: string[],
): boolean {
  // Clean the node name by removing arrow prefixes (→ and ←) and whitespace
  const cleanNodeName = nodeName.replace(/^[→←]\s*/, '');

  return includePatterns.some(pattern => {
    // Handle negation patterns (patterns starting with !)
    if (pattern.startsWith('!')) {
      const negatedPattern = pattern.slice(1);
      return !minimatch(cleanNodeName, negatedPattern);
    }
    return minimatch(cleanNodeName, pattern);
  });
}

/**
 * Recursively filters nodes based on include patterns
 */
function filterTreeNode(
  node: BundleStatsNode,
  includePatterns: string[],
): BundleStatsNode | null {
  // Check if current node matches include patterns
  const matchesPatterns = matchesIncludePatterns(node.name, includePatterns);

  // Filter children recursively
  const filteredChildren: BundleStatsNode[] = [];
  if (node.children) {
    for (const child of node.children) {
      const filteredChild = filterTreeNode(child, includePatterns);
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    }
  }

  // Include node if:
  // 1. It matches patterns, OR
  // 2. It has filtered children (even if it doesn't match patterns itself), OR
  // 3. It's a structural node (like 'inputs', 'outputs', 'bundle')
  const isStructuralNode = ['bundle', 'inputs', 'outputs'].includes(node.name);

  if (matchesPatterns || filteredChildren.length > 0 || isStructuralNode) {
    return {
      ...node,
      children: filteredChildren.length > 0 ? filteredChildren : undefined,
    };
  }

  return null;
}

/**
 * Filters a unified tree based on configuration and returns separate trees for each config
 */
export function filterUnifiedTreeByConfig(
  unifiedTree: BasicTree,
  configs: BundleStatsConfig[],
): BasicTree[] {
  const results: BasicTree[] = [];

  for (const config of configs) {
    // Filter the tree based on current config
    const filteredRoot = filterTreeNode(
      unifiedTree.root as BundleStatsNode,
      config.include,
    );

    if (filteredRoot) {
      // Create a new tree with the config name as title
      const filteredTree: BasicTree = {
        title: config.name,
        type: 'basic',
        root: {
          name: config.name, // Use config name as root name
          values: filteredRoot.values,
          children: filteredRoot.children,
        },
      };

      results.push(filteredTree);
    }
  }

  return results;
}
