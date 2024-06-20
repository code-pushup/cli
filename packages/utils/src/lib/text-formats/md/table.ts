import { Table, TableAlignment } from '@code-pushup/models';
import {
  columnsToStringArray,
  getColumnAlignments,
  rowToStringArray,
} from '../table';
import { lines, section } from './section';

const alignString = new Map<TableAlignment, string>([
  ['left', ':--'],
  ['center', ':--:'],
  ['right', '--:'],
]);

function tableRow(rows: string[]): string {
  return `|${rows.join('|')}|`;
}

/**
 * | Table Header 1  | Table Header 2 |
 * | :-------------- | -------------: |
 * |  String 1       |  1             |
 * |  String 1       |  2             |
 * |  String 1       |  3             |
 */
export function table(data: Table): string {
  if (data.rows.length === 0) {
    throw new Error("Data can't be empty");
  }

  const alignmentRow = getColumnAlignments(data).map(
    s => alignString.get(s) ?? String(alignString.get('center')),
  );

  return section(
    `${lines(
      tableRow(columnsToStringArray(data)),
      tableRow(alignmentRow),
      ...rowToStringArray(data).map(tableRow),
    )}`,
  );
}
