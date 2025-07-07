import { formatBytes, truncateText } from '@code-pushup/utils';
import type {
  BundleStatsNode,
  BundleStatsTree,
  SupportedImportKind,
} from '../unify/bundle-stats.types.js';

// Enhanced icon mappings for different import types and entry points
const IMPORT_TYPE_ICONS = {
  // Entry points
  'entry-point': '🚀',

  // ES6 Module imports
  'import-statement': '📦',
  'import-side-effect': '⚡',
  'import-specifier': '🔧',
  'import-default': '📋',
  'import-namespace': '🌐',

  // Dynamic imports
  'dynamic-import': '🔄',

  // CommonJS
  'require-call': '📞',
  'require-resolve': '🔍',

  // CSS imports
  'import-rule': '🎨',
  'url-token': '🖼️',

  // Asset imports
  'asset-import': '📄',

  // Re-exports
  'export-import': '♻️',

  // Bundler-specific
  'extract-css': '🎨',
  'context-element': '🔀',
  'hot-module': '🔥',
  delegated: '🤝',

  // Fallback
  static: '▶', // Dark arrow for static imports
  dynamic: '▷', // Light arrow for dynamic imports
} as const;

const NODE_TYPE_ICONS = {
  chunk: '📦',
  import: '📥',
  input: '📄',
  asset: '📄',
  group: '📦', // Default group icon, will be overridden by custom icons
} as const;

/**
 * Gets the appropriate icon for an import based on its kind and type
 */
export function getImportIcon(
  importKind?: SupportedImportKind,
  specificKind?: string,
  isEntryPoint?: boolean,
): string {
  // Entry points get special treatment
  if (isEntryPoint) {
    return IMPORT_TYPE_ICONS['entry-point'];
  }

  // Use specific import kind if available
  if (specificKind && specificKind in IMPORT_TYPE_ICONS) {
    return IMPORT_TYPE_ICONS[specificKind as keyof typeof IMPORT_TYPE_ICONS];
  }

  // Fallback to general import kind
  if (importKind && importKind in IMPORT_TYPE_ICONS) {
    return IMPORT_TYPE_ICONS[importKind as keyof typeof IMPORT_TYPE_ICONS];
  }

  return IMPORT_TYPE_ICONS.static; // Default fallback
}

/**
 * Gets the appropriate icon for a node based on its type
 */
export function getNodeIcon(node: BundleStatsNode): string {
  if (node.values.type === 'import') {
    // For import nodes, check if it's an entry point
    const isEntryPoint =
      node.values.path?.includes('main.') ||
      node.values.path?.includes('index.') ||
      node.name.includes('main.') ||
      node.name.includes('index.');

    return getImportIcon(node.values.importKind, undefined, isEntryPoint);
  }

  return (
    NODE_TYPE_ICONS[node.values.type as keyof typeof NODE_TYPE_ICONS] || '📄'
  );
}

/**
 * Enhanced format function that creates formatted labels with icons
 */
export function formatNodeLabel(node: BundleStatsNode): string {
  const icon = getNodeIcon(node);
  const displayName = short(node.name);
  const sizeInfo = bytes(node) > 0 ? ` (${formatBytes(bytes(node))})` : '';

  // Add additional context for imports
  if (node.values.type === 'import') {
    const kindLabel = node.values.importKind === 'dynamic' ? ' [dynamic]' : '';
    return `${icon} ${displayName}${kindLabel}${sizeInfo}`;
  }

  // Add context for chunks
  if (node.values.type === 'chunk') {
    const entryLabel = node.values.isEntryFile ? ' [entry]' : '';
    return `${icon} ${displayName}${entryLabel}${sizeInfo}`;
  }

  return `${icon} ${displayName}${sizeInfo}`;
}

/**
 * Enhanced tree connector that uses appropriate icons
 */
export function formatTreeConnector(
  node: BundleStatsNode,
  isLast: boolean,
): string {
  const baseConnector = isLast ? '└─ ' : '├─ ';

  if (node.values.type === 'import') {
    const arrow = node.values.importKind === 'dynamic' ? '▷' : '▶';
    return `${baseConnector}${arrow} `;
  }

  return baseConnector;
}

export const short = (p: string): string =>
  truncateText(p.replace(process.cwd(), '⟨CWD⟩'), { maxChars: 80 });

export const bytes = (node: BundleStatsNode): number => {
  if (!node.values) {
    return 0;
  }

  if (
    node.values.type === 'chunk' ||
    node.values.type === 'input' ||
    node.values.type === 'asset' ||
    node.values.type === 'group'
  ) {
    return node.values.bytes || 0;
  }

  if (node.values.type === 'import') {
    return node.values.bytes || 0;
  }

  return 0;
};

/**
 * Enhanced formatting configuration for tree nodes with icons
 */
export interface FormatConfig {
  /** Whether to show file counts for grouped items */
  showFileCounts?: boolean;
  /** Whether to show size information */
  showSizes?: boolean;
}

/**
 * Gets the appropriate icon and prefix for a node based on its type and context
 */
export function getNodeIconAndPrefix(
  node: BundleStatsNode,
  isLast: boolean = false,
  isEntry: boolean = false,
): { icon: string; prefix: string } {
  // Check for custom icon first (set by grouping rules)
  if ((node.values as any).icon) {
    return { icon: (node.values as any).icon, prefix: '' };
  }

  // Special handling for root bundle nodes (like initial-bundles, shared-chunks, etc.)
  if (
    isEntry &&
    (node.name.includes('-bundles') ||
      node.name.includes('-chunks') ||
      node.name.includes('bundle'))
  ) {
    return { icon: '🗂️', prefix: '' };
  }

  // Show pin for root entry or main entry chunks (not all entry files)
  const isMainEntry =
    isEntry ||
    (node.values.type === 'chunk' &&
      node.values.isEntryFile &&
      (node.name.includes('main') || node.name.includes('polyfills')));

  if (isMainEntry) {
    return { icon: '📍', prefix: '' };
  }

  switch (node.values.type) {
    case 'chunk':
      return { icon: '📄', prefix: '' };
    case 'import':
      const arrow = node.values.importKind === 'dynamic' ? '▷' : '▶';
      return { icon: arrow, prefix: 'imported from ' };
    case 'input':
      if (node.values.path?.endsWith('.css') || node.name.endsWith('.css')) {
        return { icon: '📄', prefix: '' };
      }
      return { icon: '', prefix: '' };
    case 'asset':
      return { icon: '📄', prefix: '' };
    case 'group':
      // Group nodes use custom icons from grouping rules
      return { icon: (node.values as any).icon || '📦', prefix: '' };
    default:
      return { icon: '', prefix: '' };
  }
}

/**
 * Formats a node with icon, size, and file count information
 */
export function formatNodeWithIcon(
  node: BundleStatsNode,
  config: FormatConfig = {},
  isLast: boolean = false,
  isEntry: boolean = false,
): string {
  const { icon, prefix } = getNodeIconAndPrefix(node, isLast, isEntry);

  const displayName = short(node.name);

  // File count is now handled in displayBytes formatting in reduce.ts,
  // so we don't include it in the name to avoid duplication

  // Format with just icon and name (no tree connectors - plugin handles that)
  if (isEntry) {
    return `${icon} ${displayName}`;
  }

  if (node.values.type === 'chunk') {
    return `${icon} ${displayName}`;
  }

  if (node.values.type === 'import') {
    // For import nodes, we need to determine what entry point they're imported from
    // For now, we'll show the imported chunk name with the prefix
    return `${prefix}${icon} ${displayName}`;
  }

  if (icon) {
    return `${icon} ${displayName}`;
  }

  return `${displayName}`;
}

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
 * Formats byte values in the tree for display
 */
export function formatTreeForDisplay(tree: BundleStatsTree): BundleStatsTree {
  return {
    ...tree,
    root: formatNodeForDisplay(tree.root),
  };
}

/**
 * Formats byte values in a tree node for display
 * Note: This returns a node with string-formatted bytes for display purposes
 */
export function formatNodeForDisplay(node: BundleStatsNode): BundleStatsNode {
  // For now, we'll keep the original approach but handle the bytes properly
  // The actual formatting of bytes to strings will be handled in the conversion step
  return {
    ...node,
    children: node.children?.map(formatNodeForDisplay) || [],
  } as BundleStatsNode;
}

/**
 * Applies icon formatting to all nodes in a tree
 * This should be called before pruning to add icons to node names
 */
export function applyIconsToTree(tree: { root: BundleStatsNode }): {
  root: BundleStatsNode;
} {
  function formatNodeInTree(
    node: BundleStatsNode,
    isEntry: boolean = false,
  ): BundleStatsNode {
    // Apply icon formatting to the node name
    const formattedName = formatNodeWithIcon(
      node,
      { showFileCounts: true },
      false,
      isEntry,
    );

    // Recursively apply to children
    const formattedChildren = node.children?.map((child: BundleStatsNode) =>
      formatNodeInTree(child, false),
    );

    return {
      ...node,
      name: formattedName,
      children: formattedChildren,
    } as BundleStatsNode;
  }

  return {
    ...tree,
    root: formatNodeInTree(tree.root, true),
  };
}
