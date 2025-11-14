import ansis from 'ansis';
import type { TableCellAlignment } from 'build-md';
import stringWidth from 'string-width';
import wrapAnsi from 'wrap-ansi';
import type {
  Table,
  TableAlignment,
  TableCellValue,
  TableColumnObject,
} from '@code-pushup/models';
import { TERMINAL_WIDTH } from '../constants.js';

type AsciiTableOptions = {
  borderless?: boolean;
  padding?: number;
  maxWidth?: number;
};

type NormalizedOptions = Required<AsciiTableOptions>;

type NormalizedTable = {
  rows: TableCell[][];
  columns?: TableCell[];
};

type TableCell = { text: string; alignment: TableAlignment };

type ColumnStats = { maxWidth: number; maxWord: string };

const DEFAULT_PADDING = 1;
const DEFAULT_ALIGNMENT = 'left' satisfies TableAlignment;
const DEFAULT_OPTIONS: NormalizedOptions = {
  borderless: false,
  padding: DEFAULT_PADDING,
  maxWidth: TERMINAL_WIDTH, // TODO: use process.stdout.columns?
};

const BORDERS = {
  single: {
    vertical: '│',
    horizontal: '─',
  },
  double: {
    top: { left: '┌', right: '┐' },
    middle: { left: '├', right: '┤' },
    bottom: { left: '└', right: '┘' },
  },
  triple: {
    top: '┬',
    middle: '┼',
    bottom: '┴',
  },
};

export function formatAsciiTable(
  table: Table,
  options?: AsciiTableOptions,
): string {
  const normalizedOptions = { ...DEFAULT_OPTIONS, ...options };
  const normalizedTable = normalizeTable(table);
  const formattedTable = formatTable(normalizedTable, normalizedOptions);

  if (table.title) {
    return `${table.title}\n\n${formattedTable}`;
  }

  return formattedTable;
}

function formatTable(
  table: NormalizedTable,
  options: NormalizedOptions,
): string {
  const columnWidths = getColumnWidths(table, options);

  return [
    formatBorderRow('top', columnWidths, options),
    ...(table.columns
      ? [
          ...wrapRow(table.columns, columnWidths).map(row =>
            formatContentRow(row, columnWidths, options),
          ),
          formatBorderRow('middle', columnWidths, options),
        ]
      : []),
    ...table.rows.flatMap(row =>
      wrapRow(row, columnWidths).map(cells =>
        formatContentRow(cells, columnWidths, options),
      ),
    ),
    formatBorderRow('bottom', columnWidths, options),
  ]
    .filter(Boolean)
    .join('\n');
}

function formatBorderRow(
  position: 'top' | 'middle' | 'bottom',
  columnWidths: number[],
  options: NormalizedOptions,
): string {
  if (options.borderless) {
    return '';
  }
  return ansis.dim(
    [
      BORDERS.double[position].left,
      columnWidths
        .map(width =>
          BORDERS.single.horizontal.repeat(width + 2 * options.padding),
        )
        .join(BORDERS.triple[position]),
      BORDERS.double[position].right,
    ].join(''),
  );
}

function formatContentRow(
  cells: TableCell[],
  columnWidths: number[],
  options: NormalizedOptions,
): string {
  const aligned = cells.map(({ text, alignment }, index) =>
    alignText(text, alignment, columnWidths[index]),
  );
  const spaces = ' '.repeat(options.padding);
  const inner = aligned.join(
    options.borderless
      ? spaces.repeat(2)
      : `${spaces}${ansis.dim(BORDERS.single.vertical)}${spaces}`,
  );
  if (options.borderless) {
    return inner.trimEnd();
  }
  return `${ansis.dim(BORDERS.single.vertical)}${spaces}${inner}${spaces}${ansis.dim(BORDERS.single.vertical)}`;
}

function wrapRow(cells: TableCell[], columnWidths: number[]): TableCell[][] {
  const emptyCell: TableCell = { text: '', alignment: DEFAULT_ALIGNMENT };

  return cells.reduce<TableCell[][]>((acc, cell, colIndex) => {
    const wrapped: string = wrapText(cell.text, columnWidths[colIndex]);
    const lines = wrapped.split('\n').filter(Boolean);

    const rowCount = Math.max(acc.length, lines.length);

    return Array.from({ length: rowCount }).map((_, rowIndex) => {
      const prevCols =
        acc[rowIndex] ?? Array.from({ length: colIndex }).map(() => emptyCell);
      const currCol = { ...cell, text: lines[rowIndex] ?? '' };
      return [...prevCols, currCol];
    });
  }, []);
}

function wrapText(text: string, width: number | undefined): string {
  if (!width || stringWidth(text) <= width) {
    return text;
  }
  const words = extractWords(text);
  const longWords = words.filter(word => word.length > width);
  const replacements = longWords.map(original => {
    const parts = original.includes('-')
      ? original.split('-')
      : partitionString(original, width - 1);
    const replacement = parts.join('-\n');
    return { original, replacement };
  });
  const textWithSplitLongWords = replacements.reduce(
    (acc, { original, replacement }) => acc.replace(original, replacement),
    text,
  );
  return wrapAnsi(textWithSplitLongWords, width);
}

function extractWords(text: string): string[] {
  return ansis
    .strip(text)
    .split(' ')
    .map(word => word.trim());
}

function partitionString(text: string, maxChars: number): string[] {
  const groups = [...text].reduce<Record<number, string[]>>(
    (acc, char, index) => {
      const key = Math.floor(index / maxChars);
      return { ...acc, [key]: [...(acc[key] ?? []), char] };
    },
    {},
  );
  return Object.values(groups).map(chars => chars.join(''));
}

function alignText(
  text: string,
  alignment: TableAlignment,
  width: number | undefined,
): string {
  if (!width) {
    return text;
  }
  const missing = width - stringWidth(text);
  switch (alignment) {
    case 'left':
      return `${text}${' '.repeat(missing)}`;
    case 'right':
      return `${' '.repeat(missing)}${text}`;
    case 'center':
      const missingLeft = Math.floor(missing / 2);
      const missingRight = missing - missingLeft;
      return `${' '.repeat(missingLeft)}${text}${' '.repeat(missingRight)}`;
  }
}

function getColumnWidths(
  table: NormalizedTable,
  options: NormalizedOptions,
): number[] {
  const columnTexts = getColumnTexts(table);
  const columnStats = aggregateColumnsStats(columnTexts);
  return adjustColumnWidthsToMax(columnStats, options);
}

function getColumnTexts(table: NormalizedTable): string[][] {
  const columnCount = table.columns?.length ?? table.rows[0]?.length ?? 0;
  return Array.from({ length: columnCount }).map((_, index) => {
    const cells: TableCell[] = [
      table.columns?.[index],
      ...table.rows.map(row => row[index]),
    ].filter(cell => cell != null);
    return cells.map(cell => cell.text);
  });
}

function aggregateColumnsStats(columnTexts: string[][]): ColumnStats[] {
  return columnTexts.map(texts => {
    const widths = texts.map(text => stringWidth(text));
    const longestWords = texts
      .flatMap(extractWords)
      .toSorted((a, b) => b.length - a.length);
    return {
      maxWidth: Math.max(...widths),
      maxWord: longestWords[0] ?? '',
    };
  });
}

function adjustColumnWidthsToMax(
  columnStats: ColumnStats[],
  options: NormalizedOptions,
): number[] {
  const tableWidth = getTableWidth(columnStats, options);
  if (tableWidth <= options.maxWidth) {
    return columnStats.map(({ maxWidth }) => maxWidth);
  }
  const overflow = tableWidth - options.maxWidth;

  return truncateColumns(columnStats, overflow);
}

function truncateColumns(
  columnStats: ColumnStats[],
  overflow: number,
): number[] {
  const sortedColumns = columnStats
    .map((stats, index) => ({ ...stats, index }))
    .toSorted(
      (a, b) => b.maxWidth - a.maxWidth || b.maxWord.length - a.maxWord.length,
    );

  let remaining = overflow;
  const newWidths = new Map<number, number>();
  for (const { index, maxWidth, maxWord } of sortedColumns) {
    const newWidth = Math.max(
      maxWidth - remaining,
      Math.ceil(maxWidth / 2),
      Math.ceil(maxWord.length / 2) + 1,
    );
    newWidths.set(index, newWidth);
    remaining -= maxWidth - newWidth;
    if (remaining <= 0) {
      break;
    }
  }
  return columnStats.map(
    ({ maxWidth }, index) => newWidths.get(index) ?? maxWidth,
  );
}

function getTableWidth(
  columnStats: ColumnStats[],
  options: NormalizedOptions,
): number {
  const contents = columnStats.reduce((acc, { maxWidth }) => acc + maxWidth, 0);
  const paddings =
    options.padding * columnStats.length * 2 - (options.borderless ? 2 : 0);
  const borders = options.borderless ? 0 : columnStats.length + 1;
  return contents + paddings + borders;
}

function normalizeTable(table: Table): NormalizedTable {
  const rows = normalizeTableRows(table.rows, table.columns);
  const columns = normalizeTableColumns(table.columns);
  return { rows, ...(columns && { columns }) };
}

function normalizeTableColumns(
  columns: Table['columns'],
): TableCell[] | undefined {
  if (
    columns == null ||
    columns.length === 0 ||
    columns.every(column => typeof column === 'string') ||
    columns.every(column => !normalizeColumnTitle(column))
  ) {
    return undefined;
  }
  return columns.map(column =>
    createCell(normalizeColumnTitle(column), column.align),
  );
}

function normalizeColumnTitle(column: TableColumnObject): string {
  return column.label ?? column.key;
}

function normalizeTableRows(
  rows: Table['rows'],
  columns: Table['columns'],
): TableCell[][] {
  const columnCount =
    columns?.length ?? Math.max(...rows.map(row => Object.keys(row).length));

  return rows.map((row): TableCell[] => {
    const rowEntries = new Map(Object.entries(row));

    if (!columns) {
      return Array.from({ length: columnCount }).map((_, i): TableCell => {
        const value = rowEntries.get(i.toString());
        return createCell(value);
      });
    }

    return columns.map((column, index): TableCell => {
      const align = typeof column === 'string' ? column : column.align;
      const key = typeof column === 'object' ? column.key : index.toString();
      const value = rowEntries.get(key);
      return createCell(value, align);
    });
  });
}

function createCell(
  value: TableCellValue | undefined,
  alignment: TableCellAlignment = DEFAULT_ALIGNMENT,
): TableCell {
  const text = value?.toString()?.trim() ?? '';
  return { text, alignment };
}
