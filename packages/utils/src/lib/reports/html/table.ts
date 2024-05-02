import { Table } from '@code-pushup/models';
import { tableToFlatArray } from '../../transform';
import { NEW_LINE } from '../md/constants';

export function tableHtml(data: Table): string {
  if (data.rows.length === 0) {
    throw new Error("Data can't be empty");
  }

  // @TODO add formatting
  const tableContent = tableToFlatArray(data).map((arr, index) => {
    if (index === 0) {
      const headerRow = arr.map(s => `<th>${s}</th>${NEW_LINE}`).join('');
      return `<tr>${headerRow}</tr>${NEW_LINE}`;
    }
    const row = arr.map(s => `<td>${s}</td>${NEW_LINE}`).join('');
    return `<tr>${row}</tr>${NEW_LINE}`;
  });
  return `<table>${NEW_LINE}${tableContent.join('')}</table>${NEW_LINE}`;
}
