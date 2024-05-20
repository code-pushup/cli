import { Table } from '@code-pushup/models';
import { columnsToStringArray, rowToStringArray } from '../../table';
import { NEW_LINE } from '../md/constants';

function wrap(elem: string, content: string): string {
  return `<${elem}>${content}</${elem}>${NEW_LINE}`;
}

function wrapRow(content: string): string {
  const elem = 'tr';
  return `<${elem}>${NEW_LINE}${content}</${elem}>${NEW_LINE}`;
}

export function tableHtml(table: Table): string {
  if (table.rows.length === 0) {
    throw new Error("Data can't be empty");
  }

  // @TODO add formatting
  const tableHeaderCols = columnsToStringArray(table)
    .map(s => wrap('th', s))
    .join('');
  const tableHeaderRow = wrapRow(tableHeaderCols);
  const tableBody = rowToStringArray(table)
    .map(arr => {
      const columns = arr.map(s => wrap('td', s)).join('');
      return wrapRow(columns);
    })
    .join('');

  return wrap('table', `${NEW_LINE}${tableHeaderRow}${tableBody}`);
}
