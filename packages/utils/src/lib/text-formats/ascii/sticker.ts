import { formatAsciiTable } from './table.js';

export function formatAsciiSticker(lines: string[]): string {
  return formatAsciiTable(
    { rows: ['', ...lines, ''].map(line => [line]) },
    { padding: 4 },
  );
}
