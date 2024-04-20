import { Table } from '@code-pushup/models';
import { tableToFlatArray } from '../../transform';
import { paragraphs } from './paragraphs';
import { section } from './section';

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

  return section(
    `${paragraphs(
      tableRow(stringArr.at(0) ?? []),
      tableRow(alignmentRow),
      ...stringArr.slice(1).map(tableRow),
    )}`,
  );
}
