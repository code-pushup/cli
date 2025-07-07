import { minimatch } from 'minimatch';
import type {
  BundleStatsNode,
  SupportedImportKind,
} from '../unify/bundle-stats.types.js';

/**
 * Checks if node matches any of the include patterns
 */
export function matchesIncludePatterns(
  node: BundleStatsNode,
  includePatterns: string[],
): boolean {
  if (includePatterns.length === 0) return true;

  const pathsToCheck = [
    node.name,
    ...(node.values.path ? [node.values.path] : []),
  ].filter(Boolean);

  const positivePatterns = includePatterns.filter(p => !p.startsWith('!'));
  const negativePatterns = includePatterns
    .filter(p => p.startsWith('!'))
    .map(p => p.slice(1));

  const matchesPositive =
    positivePatterns.length === 0 ||
    positivePatterns.some(pattern =>
      pathsToCheck.some(path => minimatch(path, pattern)),
    );

  const matchesNegative = negativePatterns.some(pattern =>
    pathsToCheck.some(path => minimatch(path, pattern)),
  );

  return matchesPositive && !matchesNegative;
}

/**
 * Filters nodes based on include patterns and import types
 */
export function filterTreeNode(
  node: BundleStatsNode,
  includePatterns: string[],
  contributesToBundleSize: (
    node: BundleStatsNode,
    allowedImportTypes?: Set<SupportedImportKind>,
  ) => boolean,
  allowedImportTypes: Set<SupportedImportKind>,
  isTopLevel: boolean = true,
): BundleStatsNode | null {
  const matchesPatterns = isTopLevel
    ? matchesIncludePatterns(node, includePatterns)
    : true;

  const isExplicitlyExcluded =
    isTopLevel && !matchesPatterns && includePatterns.length > 0;

  const contributes = contributesToBundleSize(node, allowedImportTypes);

  const isLookingForNodeModules = includePatterns.some(pattern =>
    pattern.includes('node_modules'),
  );

  const filteredChildren: BundleStatsNode[] = [];
  if (node.children) {
    for (const child of node.children) {
      const shouldUsePatterns =
        (isTopLevel &&
          (node.values.type !== 'chunk' || node.name === 'bundle')) ||
        (isLookingForNodeModules && node.values.type === 'chunk');

      const filteredChild = filterTreeNode(
        child,
        includePatterns,
        contributesToBundleSize,
        allowedImportTypes,
        shouldUsePatterns,
      );
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    }
  }

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
