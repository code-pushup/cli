import { Table } from '@code-pushup/models';
import { getColumnAlignments, tableToStringArray } from '../../transform';
import { lines, section } from './section';

export type Alignment = 'l' | 'c' | 'r';
const alignString = new Map<Alignment, string>([
  ['l', ':--'],
  ['c', ':--:'],
  ['r', '--:'],
]);

function tableRow(rows: (string | number)[]): string {
  return `|${rows.join('|')}|`;
}

/**
 * | Table Header 1  | Table Header 2 |
 * | --------------- | -------------- |
 * |  String 1       |  1             |
 * |  String 1       |  2             |
 * |  String 1       |  3             |
 */
export function tableMd<T extends Table>(data: T): string {
  const { rows = [], headings = [] } = data;
  if (rows.length === 0) {
    throw new Error("Data can't be empty");
  }

  const stringArr = tableToStringArray(data);

  const alignmentRow = getColumnAlignments(rows, headings).map(
    s => alignString.get(s) ?? String(alignString.get('c')),
  );

  return section(
    `${lines(
      tableRow(stringArr.at(0) ?? []),
      tableRow(alignmentRow),
      ...stringArr.slice(1).map(tableRow),
    )}`,
  );
}
