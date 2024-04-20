import { Table } from '@code-pushup/models';
import { Hierarchy, headline, paragraphs, tableMd } from './md';

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
  return paragraphs(heading ? render(heading, level) : false, tableMd(table));
}
