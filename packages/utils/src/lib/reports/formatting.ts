import {
  type HeadingLevel,
  type InlineText,
  MarkdownDocument,
  md,
} from 'build-md';
import path from 'node:path';
import type {
  AuditReport,
  SourceFileLocation,
  Table,
  Tree,
} from '@code-pushup/models';
import { formatAsciiTree } from '../text-formats/ascii/tree.js';
import {
  columnsToStringArray,
  getColumnAlignments,
  rowToStringArray,
} from '../text-formats/table.js';
import { AUDIT_DETAILS_HEADING_LEVEL } from './constants.js';
import {
  getEnvironmentType,
  getGitHubBaseUrl,
  getGitLabBaseUrl,
} from './environment-type.js';
import type { MdReportOptions } from './types.js';

export function tableSection(
  table: Table,
  options?: {
    level?: HeadingLevel;
  },
): MarkdownDocument | null {
  if (table.rows.length === 0) {
    return null;
  }
  const { level = AUDIT_DETAILS_HEADING_LEVEL } = options ?? {};
  const columns = columnsToStringArray(table);
  const alignments = getColumnAlignments(table);
  const rows = rowToStringArray(table);
  return new MarkdownDocument().heading(level, table.title).table(
    columns.map((heading, i) => {
      const alignment = alignments[i];
      if (alignment) {
        return { heading, alignment };
      }
      return heading;
    }),
    rows,
  );
}

export function treeSection(
  tree: Tree,
  options?: {
    level?: HeadingLevel;
  },
): MarkdownDocument {
  const { level = AUDIT_DETAILS_HEADING_LEVEL } = options ?? {};
  return new MarkdownDocument()
    .heading(level, tree.title)
    .code(formatAsciiTree(tree));
}

// @TODO extract `Pick<AuditReport, 'docsUrl' | 'description'>` to a reusable schema and type
export function metaDescription(
  audit: Pick<AuditReport, 'docsUrl' | 'description'>,
): InlineText {
  const docsUrl = audit.docsUrl;
  const description = audit.description?.trim();
  if (docsUrl) {
    const docsLink = md.link(docsUrl, '📖 Docs');
    if (!description) {
      return docsLink;
    }
    const formattedDescription = wrapTags(description);
    const parsedDescription = formattedDescription.endsWith('```')
      ? `${formattedDescription}\n\n`
      : `${formattedDescription} `;
    return md`${parsedDescription}${docsLink}`;
  }
  if (description && description.trim().length > 0) {
    return wrapTags(description);
  }
  return '';
}

/**
 * Link to local source for IDE
 * @param source
 * @param reportLocation
 *
 * @example
 * linkToLocalSourceInIde({ file: 'src/index.ts' }, { outputDir: '.code-pushup' }) // [`src/index.ts`](../src/index.ts)
 */
export function linkToLocalSourceForIde(
  source: SourceFileLocation,
  options?: Pick<MdReportOptions, 'outputDir'>,
): InlineText {
  const { file, position } = source;
  const { outputDir } = options ?? {};

  // NOT linkable
  if (!outputDir) {
    return md.code(file);
  }

  return md.link(formatFileLink(file, position, outputDir), md.code(file));
}

export function formatSourceLine(
  position: SourceFileLocation['position'],
): string {
  if (!position) {
    return '';
  }
  const { startLine, endLine } = position;
  return endLine && startLine !== endLine
    ? `${startLine}-${endLine}`
    : `${startLine}`;
}

export function formatGitHubLink(
  file: string,
  position: SourceFileLocation['position'],
): string {
  const baseUrl = getGitHubBaseUrl();
  if (!position) {
    return `${baseUrl}/${file}`;
  }
  const { startLine, endLine, startColumn, endColumn } = position;
  const start = startColumn ? `L${startLine}C${startColumn}` : `L${startLine}`;
  const end = endLine
    ? endColumn
      ? `L${endLine}C${endColumn}`
      : `L${endLine}`
    : '';
  const lineRange = end && start !== end ? `${start}-${end}` : start;
  return `${baseUrl}/${file}#${lineRange}`;
}

export function formatGitLabLink(
  file: string,
  position: SourceFileLocation['position'],
): string {
  const baseUrl = getGitLabBaseUrl();
  if (!position) {
    return `${baseUrl}/${file}`;
  }
  const { startLine, endLine } = position;
  const lineRange =
    endLine && startLine !== endLine ? `${startLine}-${endLine}` : startLine;
  return `${baseUrl}/${file}#L${lineRange}`;
}

export function formatFileLink(
  file: string,
  position: SourceFileLocation['position'],
  outputDir: string,
): string {
  const relativePath = path.posix.relative(outputDir, file);
  const env = getEnvironmentType();

  switch (env) {
    case 'vscode':
      return position ? `${relativePath}#L${position.startLine}` : relativePath;
    case 'github':
      return formatGitHubLink(file, position);
    case 'gitlab':
      return formatGitLabLink(file, position);
    default:
      return relativePath;
  }
}

/**
 * Wraps HTML tags in backticks to prevent markdown parsers
 * from interpreting them as actual HTML.
 */
export function wrapTags(text: string | undefined): string {
  if (!text) {
    return '';
  }
  return text.replace(/<[a-z][a-z0-9]*[^>]*>/gi, '`$&`');
}
