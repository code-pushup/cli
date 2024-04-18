import { Table } from '@code-pushup/models';
import { tableToFlatArray } from '../../transform';
import { NEW_LINE } from '../constants';

export type Alignment = 'l' | 'c' | 'r';
const alignString = new Map<Alignment, string>([
  ['l', ':--'],
  ['c', ':--:'],
  ['r', '--:'],
]);

function stringsToTableRowAndNewLine(rows: (string | number)[]): string {
  return `|${rows.join('|')}|${NEW_LINE}`;
}
/**
 * | Table Header 1  | Table Header 2 |
 * | --------------- | -------------- |
 * |  String 1       |  1             |
 * |  String 1       |  2             |
 * |  String 1       |  3             |
 */
export function tableMd<T extends Table>(data: T): string {
  const { rows = [], alignment } = data;
  if (rows.length === 0) {
    throw new Error("Data can't be empty");
  }

  const stringArr = tableToFlatArray(data);

  const allCenterAlignments = (
    typeof rows.at(0) === 'string'
      ? Array.from({ length: rows.length })
      : Object.keys(rows.at(0) ?? {})
  ).map(() => 'c' as Alignment);
  const alignmentSetting =
    alignment == null ? allCenterAlignments : alignment.map(align => align);

  const alignmentRow = alignmentSetting.map(
    s => alignString.get(s) ?? String(alignString.get('c')),
  );

  return (
    stringsToTableRowAndNewLine(stringArr.at(0) ?? []) +
    stringsToTableRowAndNewLine(alignmentRow) +
    stringArr.slice(1).map(stringsToTableRowAndNewLine).join('')
  );
}

export function tableHtml(data: Table): string {
  if (data.rows.length === 0) {
    throw new Error("Data can't be empty");
  }

  // @TODO add formatting via prettier
  const tableContent = tableToFlatArray(data).map((arr, index) => {
    if (index === 0) {
      const headerRow = arr.map(s => `<th>${s}</th>\n`).join('');
      return `<tr>${headerRow}</tr>\n`;
    }
    const row = arr.map(s => `<td>${s}</td>\n`).join('');
    return `<tr>${row}</tr>\n`;
  });
  return `<table>\n${tableContent.join('')}</table>`;
}
