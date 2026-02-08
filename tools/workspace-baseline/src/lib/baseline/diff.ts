import { type Tree } from '@nx/devkit';
import ansis from 'ansis';
import { createTwoFilesPatch } from 'diff';

// Force color support for terminals/IDEs that don't auto-detect ANSI
process.env.FORCE_COLOR = '1';

export type RenderTreeDiffOptions = {
  /**
   * Optional title to display above the diff
   */
  title?: string;
  /**
   * Number of unchanged lines to show around changes for context
   * @default 3
   */
  context?: number;
};

/**
 * Renders a GitHub-style diff between the current content in the tree
 * and the proposed next content. Does nothing if the content is unchanged.
 *
 * @param tree - The Nx Tree to read the current content from
 * @param filePath - Path to the file to compare
 * @param nextContent - The new content to compare against
 * @param options - Optional configuration for the diff display
 *
 * @example Basic usage
 * ```typescript
 * renderTreeDiff(tree, 'tsconfig.json', newContent, {
 *   title: '📄 tsconfig.json',
 * });
 * ```
 *
 * @example Integration with createBaselineFile
 * ```typescript
 * // Before writing the baseline file:
 * renderTreeDiff(tree, baselinePath, baselineContent, {
 *   title: `📄 ${baselinePath}`,
 * });
 * tree.write(baselinePath, baselineContent);
 * ```
 */
// Maximum file size for diff rendering (100KB)
const MAX_DIFF_SIZE = 100 * 1024;

export function renderTreeDiff(
  tree: Tree,
  filePath: string,
  nextContent: string,
  options?: RenderTreeDiffOptions,
): string {
  const prevContent = tree.exists(filePath)
    ? (tree.read(filePath, 'utf-8') ?? '')
    : '';

  if (prevContent === nextContent) {
    return '';
  }

  // Skip diff for very large files to avoid performance issues
  if (
    prevContent.length > MAX_DIFF_SIZE ||
    nextContent.length > MAX_DIFF_SIZE
  ) {
    const lines: string[] = [];
    if (options?.title) {
      lines.push(ansis.bold.cyan(options.title));
    }
    const sizeInfo = `(File too large for diff: ${Math.round(Math.max(prevContent.length, nextContent.length) / 1024)}KB)`;
    lines.push(ansis.yellow(sizeInfo));
    lines.push(ansis.green('+ File will be updated'));
    return lines.join('\n');
  }

  const diff = createTwoFilesPatch(
    filePath,
    filePath,
    prevContent,
    nextContent,
    'before',
    'after',
    { context: options?.context ?? 3 },
  );

  const lines: string[] = [];

  if (options?.title) {
    lines.push(ansis.bold.cyan(options.title));
  }

  lines.push(formatPrettyDiff(diff));

  return lines.join('\n');
}

/**
 * Formats a unified diff with GitHub-style formatting.
 * Uses ANSI colors for better readability in terminals.
 *
 * @param diff - The unified diff string from createTwoFilesPatch
 * @returns Formatted diff string with ANSI colors
 *
 * @internal
 */
function formatPrettyDiff(diff: string): string {
  const lines: string[] = [];

  for (const line of diff.split('\n')) {
    // Skip file markers
    if (line.startsWith('+++') || line.startsWith('---')) {
      continue;
    }

    // Hunk headers
    if (line.startsWith('@@')) {
      lines.push(ansis.gray(line));
    }
    // Additions
    else if (line.startsWith('+')) {
      lines.push(ansis.bgGreen.black(` ${line}`));
    }
    // Deletions
    else if (line.startsWith('-')) {
      lines.push(ansis.bgRed.black(` ${line}`));
    }
    // Context lines
    else {
      lines.push(ansis.gray(` ${line}`));
    }
  }

  return lines.join('\n');
}
