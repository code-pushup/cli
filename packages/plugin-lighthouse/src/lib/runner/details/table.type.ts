import type Details from 'lighthouse/types/lhr/audit-details';
import {
  Table,
  TableColumnObject,
  TableRowObject,
  tableSchema,
} from '@code-pushup/models';
import { formatTableItemPropertyValue } from './item-value';
import { LighthouseAuditDetailsParsingError } from './utils';

export function parseTableToAuditDetailsTable(
  details: Details.Table,
): Table | undefined {
  const { headings: rawHeadings, items } = details;

  if (items.length === 0) {
    return undefined;
  }

  try {
    return tableSchema().parse({
      columns: parseTableColumns(rawHeadings),
      rows: items.map(row => parseTableRow(row, rawHeadings)),
    });
  } catch (error) {
    throw new LighthouseAuditDetailsParsingError(
      'table',
      { items, headings: rawHeadings },
      (error as Error).message.toString(),
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
        return parseTableEntry([key, value], valueType);
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
