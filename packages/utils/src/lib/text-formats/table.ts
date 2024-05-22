import {
  PrimitiveValue,
  Table,
  TableAlignment,
  TableColumnObject,
  TableColumnPrimitive,
} from '@code-pushup/models';
import { capitalize } from '../transform';

export function rowToStringArray({ rows, columns = [] }: Table): string[][] {
  if (Array.isArray(rows.at(0)) && typeof columns.at(0) === 'object') {
    throw new TypeError(
      'Column can`t be object when rows are primitive values',
    );
  }

  return rows.map(row => {
    // row = ['100 ms', '200 ms']
    if (Array.isArray(row)) {
      return row.map(String);
    }

    // row = { prop1: '100 ms', prop2: '200 ms' }
    const objectRow = row;

    // columns [] || column = 'center'
    if (columns.length === 0 || typeof columns.at(0) === 'string') {
      return Object.values(objectRow).map(String);
    }

    // column = {key: 'prop1'}
    return (columns as TableColumnObject[]).map(({ key }): string =>
      String(objectRow[key]),
    );
  });
}

// Determine effective columns based on the input rows and optional columns parameter
export function columnsToStringArray({ rows, columns = [] }: Table): string[] {
  const firstRow = rows.at(0);
  const primitiveRows = Array.isArray(firstRow);

  if (typeof columns.at(0) === 'string' && !primitiveRows) {
    throw new Error('invalid union type. Caught by model parsing.');
  }

  if (columns.length === 0) {
    if (Array.isArray(firstRow)) {
      return (firstRow as unknown[]).map((_, idx) => String(idx));
    }
    return Object.keys(firstRow as object);
  }

  // columns = ['right', 'left']; row = ['100 ms', '200 ms'] => 1,2,3
  if (typeof columns.at(0) === 'string') {
    return columns.map(String);
  }

  // columns = [
  // {key: 'prop1' label: 'Property 1'},
  // {key: 'prop2'}
  // ]; row = [ {prop1: '100 ms', prop2: '200 ms'}] => Property 1, Prop2
  const cols = columns as TableColumnObject[];
  return cols.map(({ label, key }) => label ?? capitalize(key));
}

export function getColumnAlignmentForKeyAndIndex(
  targetKey: string,
  targetIdx: number,
  columns: TableColumnObject[] = [],
): TableAlignment {
  const column =
    columns.at(targetIdx) ?? columns.find(col => col.key === targetKey);
  if (typeof column === 'string') {
    return column as TableAlignment;
  } else if (typeof column === 'object') {
    return column.align ?? 'center';
  } else {
    return 'center';
  }
}

export function getColumnAlignmentForIndex(
  targetIdx: number,
  columns: TableColumnPrimitive[] = [],
): TableAlignment {
  const column = columns.at(targetIdx) as
    | TableColumnObject
    | TableAlignment
    | undefined;
  if (column == null) {
    return 'center';
  } else if (typeof column === 'string') {
    return column as TableAlignment;
  } else if (typeof column === 'object') {
    return column.align ?? 'center';
  } else {
    return 'center';
  }
}

export function getColumnAlignments({
  rows,
  columns = [],
}: Table): TableAlignment[] {
  // this is caught by the table schema in @code-pushup/models
  if (rows.at(0) == null) {
    throw new Error('first row can`t be undefined.');
  }

  if (Array.isArray(rows.at(0))) {
    const firstPrimitiveRow = rows.at(0) as PrimitiveValue[];
    return Array.from({ length: firstPrimitiveRow.length }).map((_, idx) =>
      getColumnAlignmentForIndex(idx, columns as TableColumnPrimitive[]),
    );
  }

  const firstObject = rows.at(0) as Record<string, unknown>;
  return Object.keys(firstObject).map((key, idx) =>
    getColumnAlignmentForKeyAndIndex(key, idx, columns as TableColumnObject[]),
  );
}
