import type {
  BasicTreeNode,
  CoverageTreeNode,
  Tree,
} from '@code-pushup/models';

type TreeNode = BasicTreeNode | CoverageTreeNode;

const INDENT_CHARS = 4;
const COL_GAP = 2;

export function formatAsciiTree(tree: Tree): string {
  const nodes = flatten(tree.root);
  const maxWidth = Math.max(
    ...nodes.map(({ node, level }) => level * INDENT_CHARS + node.name.length),
  );
  const keysMaxWidths =
    tree.type === 'coverage'
      ? {}
      : nodes.reduce<Record<string, number>>(
          (acc, { node }) => ({
            ...acc,
            ...Object.fromEntries(
              Object.entries(node.values ?? {}).map(([key, value]) => [
                key,
                Math.max(acc[key] ?? 0, `${value}`.length),
              ]),
            ),
          }),
          {},
        );

  return formatTreeNode(tree.root, '', maxWidth, keysMaxWidths)
    .map(line => `${line}\n`)
    .join('');
}

function formatTreeNode(
  node: TreeNode,
  prefix: string,
  maxWidth: number,
  keysMaxWidths: Record<string, number>,
): string[] {
  const childPrefix = prefix.replace(/[└─]/g, ' ').replace(/├/g, '│');

  const prefixedName = `${prefix}${node.name}`;
  const padding = ' '.repeat(maxWidth + COL_GAP * 2 - prefixedName.length);
  const values = formatNodeValues(node.values, keysMaxWidths);
  const offsetValues = values ? `${padding}${values}` : '';
  const formattedNode = `${prefixedName}${offsetValues}`;

  return [
    formattedNode,
    ...(node.children?.flatMap((child, i, arr) =>
      formatTreeNode(
        child,
        i === arr.length - 1 ? `${childPrefix}└── ` : `${childPrefix}├── `,
        maxWidth,
        keysMaxWidths,
      ),
    ) ?? []),
  ];
}

function formatNodeValues(
  values: TreeNode['values'],
  keysMaxWidths: Record<string, number>,
): string {
  if (!values) {
    return '';
  }

  if ('coverage' in values && typeof values.coverage === 'number') {
    const percentage = coveragePercentage(values.coverage);
    const maxLength = coveragePercentage(1).length;
    const formattedCoverage = `${percentage.padStart(maxLength, ' ')} %`;
    if (!Array.isArray(values.missing) || values.missing.length === 0) {
      return formattedCoverage;
    }
    const formattedMissing = values.missing
      .map(({ name, startLine, endLine }): string => {
        const range =
          startLine === endLine
            ? startLine.toString()
            : `${startLine}-${endLine}`;
        return name ? `${name} (${range})` : range;
      })
      .join(', ');
    return `${formattedCoverage}${' '.repeat(COL_GAP)}${formattedMissing}`;
  }

  const valuesMap = new Map(
    Object.entries(values).filter(
      (pair): pair is [string, string | number] =>
        typeof pair[1] === 'string' || typeof pair[1] === 'number',
    ),
  );
  return Object.entries(keysMaxWidths)
    .map(([key, maxWidth]) => {
      const value = valuesMap.get(key)?.toString() ?? '';
      return value.padStart(maxWidth, ' ');
    })
    .join(' '.repeat(COL_GAP));
}

function flatten(
  node: TreeNode,
  level = 0,
): { node: TreeNode; level: number }[] {
  return [
    { node, level },
    ...(node.children?.flatMap(child => flatten(child, level + 1)) ?? []),
  ];
}

function coveragePercentage(coverage: number): string {
  return (coverage * 100).toFixed(2);
}
