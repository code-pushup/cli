import {
  type HeadingLevel,
  type InlineText,
  MarkdownDocument,
  md,
} from 'build-md';
import type { AuditReport, Table } from '@code-pushup/models';
import { HIERARCHY } from '../text-formats';
import {
  columnsToStringArray,
  getColumnAlignments,
  rowToStringArray,
} from '../text-formats/table';

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
