import type { Treemap } from 'lighthouse';
import type Details from 'lighthouse/types/lhr/audit-details';
import type { BasicTree, BasicTreeNode } from '@code-pushup/models';
import { formatBytes } from '@code-pushup/utils';

export function parseTreemapDataToBasicTrees(
  details: Details.TreemapData,
): BasicTree[] {
  return details.nodes.map(node => ({
    type: 'basic',
    root: treemapNodeToBasicTreeNode(node),
  }));
}

function treemapNodeToBasicTreeNode(node: Treemap.Node): BasicTreeNode {
  return {
    name: node.name,
    values: {
      resourceBytes: formatBytes(node.resourceBytes),
      ...(node.unusedBytes != null && {
        unusedBytes: formatBytes(node.unusedBytes),
      }),
      ...(node.duplicatedNormalizedModuleName && {
        duplicatedNormalizedModuleName: node.duplicatedNormalizedModuleName,
      }),
    },
    ...(node.children && {
      children: node.children.map(treemapNodeToBasicTreeNode),
    }),
  };
}
