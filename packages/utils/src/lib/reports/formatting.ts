import {
  type HeadingLevel,
  type InlineText,
  MarkdownDocument,
  md,
} from 'build-md';
import * as path from 'node:path';
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
): string {
  const { file, position } = source;

  const unixPath = file.replace(/\\/g, '/');

  const { outputDir } = options ?? {};

  // NOT linkable
  if (!outputDir) {
    return unixPath;
  }

  const relativePath = path.relative(outputDir, unixPath);
  return md
    .link(formatFilePosition(relativePath, position), unixPath)
    .toString();
}

export function formatSourceLine(source: SourceFileLocation) {
  const { startLine, endLine } = source?.position ?? {};
  return `${startLine || ''}${
    endLine && startLine !== endLine ? `-${endLine}` : ''
  }`;
}

function formatFilePosition(
  file: string,
  position?: SourceFileLocation['position'],
) {
  if (!position) {
    return file;
  }
  const { startLine, startColumn } = position;

  if (!startLine) {
    return file;
  }

  if (!startColumn) {
    return `${file}:${startLine}`;
  }

  return `${file}:${startLine}:${startColumn}`;
}
