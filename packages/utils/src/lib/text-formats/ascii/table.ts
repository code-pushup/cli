import ansis from 'ansis';
import type { TableCellAlignment } from 'build-md';
import stringWidth from 'string-width';
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
};

type NormalizedOptions = Required<AsciiTableOptions>;

type NormalizedTable = {
  rows: TableCell[][];
  columns?: TableCell[];
};

type TableCell = { text: string; alignment: TableAlignment };

const DEFAULT_PADDING = 1;
const DEFAULT_ALIGNMENT = 'left' satisfies TableAlignment;
const MAX_WIDTH = TERMINAL_WIDTH; // TODO: use process.stdout.columns?
const DEFAULT_OPTIONS: NormalizedOptions = {
  borderless: false,
  padding: DEFAULT_PADDING,
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
  // TODO: enforce MAX_WIDTH
  const columnWidths = getColumnWidths(table);

  return [
    formatBorderRow('top', columnWidths, options),
    ...(table.columns
      ? [
          formatContentRow(table.columns, columnWidths, options),
          formatBorderRow('middle', columnWidths, options),
        ]
      : []),
    ...table.rows.map(cells => formatContentRow(cells, columnWidths, options)),
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

function getColumnWidths(table: NormalizedTable): number[] {
  const columnCount = table.columns?.length ?? table.rows[0]?.length ?? 0;
  return Array.from({ length: columnCount }).map((_, index) => {
    const cells: TableCell[] = [
      table.columns?.[index],
      ...table.rows.map(row => row[index]),
    ].filter(cell => cell != null);
    const texts = cells.map(cell => cell.text);
    const widths = texts.map(text => stringWidth(text));
    return Math.max(...widths);
  });
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
