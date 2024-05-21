import type { IcuMessage } from 'lighthouse';
import type Details from 'lighthouse/types/lhr/audit-details';
import {
  Table,
  TableAlignment,
  TableColumnObject,
  TableRowObject,
} from '@code-pushup/models';
import { formatBytes, formatDuration, html } from '@code-pushup/utils';
import { parseNode } from './utils';

export function parseTableToAuditDetailsTable(
  details: Details.Table,
): Table | undefined {
  const { headings: rawHeadings, items } = details;

  if (items.length === 0) {
    return undefined;
  }

  return {
    columns: parseTableColumns(rawHeadings),
    rows: items.map(row => parseTableRows(row, rawHeadings)),
  };
}

export function parseTableColumns(
  rawHeadings: Details.TableColumnHeading[],
): TableColumnObject[] {
  return rawHeadings.map(({ key, label }) => ({
    key: key ?? '',
    label: typeof label === 'string' ? label : undefined,
    align: 'left' as TableAlignment,
  }));
}

function getItemValue(
  item?: Details.ItemValue,
): string | number | boolean | undefined {
  if (typeof item === 'string') {
    return item;
  }
  if (typeof item === 'number') {
    return item;
  }
  if (typeof item === 'boolean') {
    return item;
  }
  if (typeof item === 'object') {
    if ('formattedDefault' in item) {
      return (item as IcuMessage).formattedDefault;
    }
    if ('value' in item) {
      return item['value'] as string;
    }
  }
  throw new Error(`Can't get value from ${item?.type}`);
}

function tableRowToString(item?: Details.ItemValue) {
  return String(item).trim();
}

export function parseTableRows(
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
        const valueType = valueTypesByKey.get(key) as Details.ItemValueType;
        return parseTableEntry([key, value], valueType);
      }),
  );
}

export function parseTableEntry(
  [key, value]: [
    keyof Details.TableItem,
    Details.TableItem[keyof Details.TableItem],
  ],
  valueType: Details.ItemValueType,
) {
  switch (valueType) {
    case 'bytes':
      const bytesValue = getItemValue(value);
      return [key, formatBytes(Number(bytesValue))];
    case 'code':
      return [key, html.code(tableRowToString(value as Details.CodeValue))];
    case 'link':
      const link = value as Details.LinkValue;
      return [key, html.link(link.url, link.text)];
    case 'url':
      return [key, html.link(tableRowToString(value as Details.UrlValue))];
    case 'timespanMs':
    case 'ms':
      const msValue = getItemValue(value);
      return [key, formatDuration(Number(msValue))];
    case 'node':
      return [key, parseNode(value as Details.NodeValue)];
    case 'source-location':
      return [
        key,
        tableRowToString((value as Details.SourceLocationValue).url).slice(200),
      ];
    case 'numeric':
      const num = Number(getItemValue(value));
      if (num.toFixed(3).toString().endsWith('.000')) {
        return [key, tableRowToString(num)];
      }
      return [key, tableRowToString(num.toFixed(3))];
    case 'text':
      return [key, tableRowToString(getItemValue(value))];
    // case 'multi':
    // case 'thumbnail':
    default:
      // throw new Error(`Type: ${valueType} not implemented`);
      return [key, `Type: ${valueType} not implemented`];
  }
}
