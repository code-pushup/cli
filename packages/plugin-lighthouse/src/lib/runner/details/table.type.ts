// @ts-ignore - lighthouse types not properly exported in v12
import type Details from 'lighthouse/types/lhr/audit-details';
import {
  type Table,
  type TableColumnObject,
  type TableRowObject,
  tableSchema,
  validate,
} from '@code-pushup/models';
import { formatTableItemPropertyValue } from './item-value.js';
import { LighthouseAuditDetailsParsingError } from './utils.js';

export function parseTableToAuditDetailsTable(
  details: Details.Table,
): Table | undefined {
  const { headings, items } = details;

  if (items.length === 0) {
    return undefined;
  }

  try {
    return validate(tableSchema(), {
      columns: parseTableColumns(headings),
      rows: items.map((row: any) => parseTableRow(row, headings)),
    });
  } catch (error) {
    throw new LighthouseAuditDetailsParsingError(
      'table',
      { items, headings },
      error,
    );
  }
}

export function parseTableColumns(
  rawHeadings: Details.TableColumnHeading[],
): TableColumnObject[] {
  return rawHeadings.map(({ key, label }) => ({
    key: key ?? '',
    ...(typeof label === 'string' && label.length > 0 ? { label } : {}),
    align: 'left',
  }));
}

export function parseTableRow(
  tableItem: Details.TableItem,
  headings: Details.TableColumnHeading[],
): TableRowObject {
  const keys = new Set(headings.map(({ key }) => key));
  const valueTypesByKey = new Map(
    headings.map(({ key, valueType }) => [key, valueType]),
  );

  return Object.fromEntries(
    Object.entries(tableItem)
      .filter(([key]) => keys.has(key))
      .map(([key, value]) => {
        const valueType = valueTypesByKey.get(key);
        return parseTableEntry([key as string, value as any], valueType);
      }),
  ) as TableRowObject;
}

export function parseTableEntry<T extends Details.TableItem>(
  [key, value]: [keyof T, T[keyof T]],
  valueType?: Details.ItemValueType,
): [keyof T, Details.ItemValue | undefined] {
  if (value == null) {
    return [key, value];
  }

  return [key, formatTableItemPropertyValue(value, valueType)];
}
