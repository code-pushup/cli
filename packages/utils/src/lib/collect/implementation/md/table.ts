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
export function table(
  data: (string | number)[][],
  align?: Alignment[],
): string {
  align = align || data[0]?.map(() => 'c');
  const _data = data.map(arr => arr.join('|'));
  const secondRow = align?.map(s => alignString.get(s)).join('|');
  return _data.shift() + '\n' + secondRow + '\n' + _data.join('\n')
}
