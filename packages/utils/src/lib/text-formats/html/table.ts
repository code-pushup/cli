import type { Table } from '@code-pushup/models';
import { NEW_LINE } from '../constants';
import { columnsToStringArray, rowToStringArray } from '../table';

function wrap(elem: string, content: string): string {
  return `<${elem}>${content}</${elem}>${NEW_LINE}`;
}

function wrapRow(content: string): string {
  const elem = 'tr';
  return `<${elem}>${NEW_LINE}${content}</${elem}>${NEW_LINE}`;
}

export function table(tableData: Table): string {
  if (tableData.rows.length === 0) {
    throw new Error("Data can't be empty");
  }

  // @TODO add formatting
  const tableHeaderCols = columnsToStringArray(tableData)
    .map(s => wrap('th', s))
    .join('');
  const tableHeaderRow = wrapRow(tableHeaderCols);
  const tableBody = rowToStringArray(tableData)
    .map(arr => {
      const columns = arr.map(s => wrap('td', s)).join('');
      return wrapRow(columns);
    })
    .join('');

  return wrap('table', `${NEW_LINE}${tableHeaderRow}${tableBody}`);
}
