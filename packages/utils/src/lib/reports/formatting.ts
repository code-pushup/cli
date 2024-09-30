import {
  type HeadingLevel,
  type InlineText,
  MarkdownDocument,
  md,
} from 'build-md';
import { posix as pathPosix } from 'node:path';
import type {
  AuditReport,
  SourceFileLocation,
  Table,
} from '@code-pushup/models';
import { HIERARCHY } from '../text-formats';
import {
  columnsToStringArray,
  getColumnAlignments,
  rowToStringArray,
} from '../text-formats/table';
import { getEnvironmentType, getGitHubBaseUrl } from './ide-environment';
import type { MdReportOptions } from './types';

export function tableSection(
  tableData: Table,
  options?: {
    level?: HeadingLevel;
  },
): MarkdownDocument | null {
  if (tableData.rows.length === 0) {
    return null;
  }
  const { level = HIERARCHY.level_4 } = options ?? {};
  const columns = columnsToStringArray(tableData);
  const alignments = getColumnAlignments(tableData);
  const rows = rowToStringArray(tableData);
  return new MarkdownDocument().heading(level, tableData.title).table(
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
    const parsedDescription = description.endsWith('```')
      ? `${description}\n\n`
      : `${description} `;
    return md`${parsedDescription}${docsLink}`;
  }
  if (description && description.trim().length > 0) {
    return description;
  }
  return '';
}

/**
 * Link to local source for IDE
 * @param source
 * @param reportLocation
 *
 * @example
 * linkToLocalSourceInIde({ file: '/src/index.ts'}, {outputDir: '/.code-pushup'}) // [/src/index.ts](../src/index.ts)
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
  return endLine
    ? startLine === endLine
      ? `${startLine}`
      : `${startLine}-${endLine}`
    : `${startLine}`;
}

export function getGitHubLink(
  file: string,
  position: SourceFileLocation['position'],
  outputDir: string,
): string {
  const baseUrl = getGitHubBaseUrl();
  const fullPath = pathPosix.join(outputDir, file);

  if (!position) {
    return `${baseUrl}/${fullPath}`;
  }

  const { startLine, endLine } = position;
  const line = endLine ? `#L${startLine}-L${endLine}` : `#L${startLine}`;
  return `${baseUrl}/${fullPath}${line}`;
}

export function formatFileLink(
  file: string,
  position: SourceFileLocation['position'],
  outputDir: string,
): string {
  const relativePath = pathPosix.relative(outputDir, file);
  const env = getEnvironmentType();

  switch (env) {
    case 'vscode':
      return position ? `${relativePath}#L${position.startLine}` : relativePath;
    case 'github':
      return getGitHubLink(file, position, outputDir);
    default:
      return relativePath;
  }
}
