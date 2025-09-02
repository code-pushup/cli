/* COPY OF https://github.com/eslint/eslint/blob/a355a0e5b2e6a47cda099b31dc7d112cfb5c4315/lib/shared/text-table.js */

/**
 * @fileoverview Optimized version of the `text-table` npm module to improve performance by replacing inefficient regex-based
 * whitespace trimming with a modern built-in method.
 *
 * This modification addresses a performance issue reported in https://github.com/eslint/eslint/issues/18709
 *
 * The `text-table` module is published under the MIT License. For the original source, refer to:
 * https://www.npmjs.com/package/text-table.
 */

/*
 *
 * This software is released under the MIT license:
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

export interface TextTableOptions {
  align?: (string | undefined)[];
  stringLength?: (str: string) => number;
}

export function textTable(
  rows_: (string | number)[][],
  opts: TextTableOptions = {},
): string {
  const hsep = '  ';
  const align = opts.align ?? [];
  const stringLength = opts.stringLength ?? ((str: string) => str.length);

  const sizes = rows_.reduce((acc: number[], row: (string | number)[]) => {
    row.forEach((c: string | number, ix: number) => {
      const n = stringLength(String(c));

      if (!acc[ix] || n > acc[ix]) {
        acc[ix] = n;
      }
    });
    return acc;
  }, []);

  return rows_
    .map((row: (string | number)[]) =>
      row
        .map((c: string | number, ix: number) => {
          const cellStr = String(c);
          const n = (sizes[ix] ?? 0) - stringLength(cellStr) || 0;
          const s = Array(Math.max(n + 1, 1)).join(' ');

          if (align[ix] === 'r') {
            return s + cellStr;
          }

          return cellStr + s;
        })
        .join(hsep)
        .trimEnd(),
    )
    .join('\n');
}
