import { NEW_LINE } from '../constants';

export type Alignment = 'l' | 'c' | 'r';
const alignString = new Map<Alignment, string>([
  ['l', ':--'],
  ['c', ':--:'],
  ['r', '--:'],
]);

/**
 * | Table Header 1  | Table Header 2 |
 * | --------------- | -------------- |
 * |  String 1       |  1             |
 * |  String 1       |  2             |
 * |  String 1       |  3             |
 */
export function tableMd(
  data: (string | number)[][],
  align?: Alignment[],
): string {
  if (data.length === 0) {
    throw new Error("Data can't be empty");
  }
  const alignmentSetting = align ?? data[0]?.map(() => 'c');
  const tableContent = data.map(arr => `|${arr.join('|')}|`);
  const alignmentRow = `|${alignmentSetting
    ?.map(s => alignString.get(s))
    .join('|')}|`;
  return (
    tableContent[0] +
    NEW_LINE +
    alignmentRow +
    NEW_LINE +
    tableContent.slice(1).join(NEW_LINE)
  );
}

export function tableHtml(data: (string | number)[][]): string {
  if (data.length === 0) {
    throw new Error("Data can't be empty");
  }

  const tableContent = data.map((arr, index) => {
    if (index === 0) {
      const headerRow = arr.map(s => `<th>${s}</th>`).join('');
      return `<tr>${headerRow}</tr>`;
    }
    const row = arr.map(s => `<td>${s}</td>`).join('');
    return `<tr>${row}</tr>`;
  });
  return `<table>${tableContent.join('')}</table>`;
}
