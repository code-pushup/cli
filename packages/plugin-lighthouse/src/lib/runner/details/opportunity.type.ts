import type Details from 'lighthouse/types/lhr/audit-details';
import {
  type Table,
  type TableRowObject,
  tableSchema,
} from '@code-pushup/models';
import { formatBytes, formatDuration, html } from '@code-pushup/utils';
import { parseTableColumns, parseTableEntry } from './table.type';
import { LighthouseAuditDetailsParsingError } from './utils';

export function parseOpportunityToAuditDetailsTable(
  details: Details.Opportunity,
): Table | undefined {
  const { headings: rawHeadings, items } = details;

  if (items.length === 0) {
    return undefined;
  }

  try {
    return tableSchema().parse({
      title: 'Opportunity',
      columns: parseTableColumns(rawHeadings),
      rows: items.map(row => parseOpportunityItemToTableRow(row, rawHeadings)),
    });
  } catch (error) {
    throw new LighthouseAuditDetailsParsingError(
      'opportunity',
      { items, headings: rawHeadings },
      (error as Error).message.toString(),
    );
  }
}

export function parseOpportunityItemToTableRow(
  opportunityItem: Details.OpportunityItem,
  headings: Details.TableColumnHeading[],
): TableRowObject {
  const keys = new Set(headings.map(({ key }) => key));
  const valueTypesByKey = new Map(
    headings.map(({ key, valueType }) => [key, valueType]),
  );

  return {
    ...(Object.fromEntries(
      Object.entries(opportunityItem)
        // forward only properties with a given value
        .filter(([key]) => keys.has(key))
        .map(([key, value]) => {
          const valueType = valueTypesByKey.get(key) as Details.ItemValueType;
          return parseOpportunityEntry([key, value], valueType);
        }),
    ) as TableRowObject),
  };
}

export function parseOpportunityEntry(
  [key, value]: [
    keyof Details.OpportunityItem,
    Details.OpportunityItem[string],
  ],
  valueType: Details.ItemValueType,
) {
  switch (key) {
    case 'url':
      return [key, html.link(String(value))];
    case 'wastedPercent':
      return [key, `${Number(value).toFixed(2)} %`];
    case 'totalBytes':
    case 'wastedBytes':
      return [key, formatBytes(Number(value))];
    case 'wastedMs':
      return [key, formatDuration(Number(value))];
    default:
      return parseTableEntry([key, value], valueType);
  }
}
