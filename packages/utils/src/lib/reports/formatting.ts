import { AuditReport, Table } from '@code-pushup/models';
import {
  Hierarchy,
  NEW_LINE,
  SPACE,
  headline,
  lines,
  link,
  paragraphs,
  section,
  tableMd,
} from './md';

export function tableSection(
  table: Table | undefined,
  options?:
    | {
        heading?: string;
        level?: Hierarchy | 0;
      }
    | string,
) {
  if (table == null) {
    return '';
  }
  if (table.rows.length === 0) {
    return '';
  }
  const { heading, level = 4 } =
    typeof options === 'string'
      ? { heading: options, level: 0 }
      : options ?? {};
  // if hierarchy is 0 do not apply heading styles
  const render = (h: string, l: Hierarchy | 0) =>
    l === 0 ? heading : headline(h, l);
  return lines(heading ? render(heading, level) : false, tableMd(table));
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
