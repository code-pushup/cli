import { AuditReport, Table } from '@code-pushup/models';
import { Hierarchy, NEW_LINE, SPACE, md } from '../text-formats';

const { headline, lines, link, section, table } = md;

export function tableSection(
  tableData: Table,
  options?: {
    level?: Hierarchy | 0;
  },
) {
  if (tableData.rows.length === 0) {
    return '';
  }
  const { level = 4 } = options ?? {};
  // if hierarchy is 0 do not apply heading styles
  const render = (h: string, l: Hierarchy | 0) =>
    l === 0 ? h : headline(h, l);
  return lines(
    tableData.title && render(tableData.title, level),
    table(tableData),
  );
}

// @TODO extract `Pick<AuditReport, 'docsUrl' | 'description'>` to a reusable schema and type
export function metaDescription({
  docsUrl,
  description,
}: Pick<AuditReport, 'docsUrl' | 'description'>): string {
  if (docsUrl) {
    const docsLink = link(docsUrl, '📖 Docs');
    if (!description) {
      return section(docsLink);
    }
    const parsedDescription = description.toString().endsWith('```')
      ? `${description}${NEW_LINE + NEW_LINE}`
      : `${description}${SPACE}`;
    return section(`${parsedDescription}${docsLink}`);
  }
  if (description && description.trim().length > 0) {
    return section(description);
  }
  return '';
}
