import { formatAsciiTable } from './table.js';

const STICKER_PADDING = 4;

export function formatAsciiSticker(lines: string[]): string {
  return formatAsciiTable(
    { rows: ['', ...lines, ''].map(line => [line]) },
    { padding: STICKER_PADDING },
  );
}
