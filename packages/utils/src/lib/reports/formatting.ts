import { Table } from '@code-pushup/models';
import { Hierarchy, headline, tableMd } from './md';
import { NEW_LINE } from './md/constants';

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
  // if hierarchy is 0 render just text
  const render = (h: string, l: Hierarchy | 0) =>
    `${l === 0 ? heading : headline(h, l)}${NEW_LINE}`;
  return `${heading ? render(heading, level) : ''}${tableMd(table)}`;
}
