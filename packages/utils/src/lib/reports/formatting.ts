// @TODO this is a questionable logic refactor
import { AuditReport, Table } from '@code-pushup/models';
import { NEW_LINE } from './constants';
import { Hierarchy, headline, style, tableMd } from './md';

export function styleBold(
  { displayValue, value }: Pick<AuditReport, 'displayValue' | 'value'>,
  isHtml = false,
): string {
  const renderedValue = displayValue || value;
  return isHtml ? `<b>${renderedValue}</b>` : style(String(renderedValue));
}

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
    l === 0 ? heading : headline(h, l);
  return `${heading ? render(heading, level) : ''}${NEW_LINE}${tableMd(
    table,
  )}${NEW_LINE}${NEW_LINE}`;
}
