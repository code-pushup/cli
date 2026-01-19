// @ts-ignore - lighthouse types not properly exported in v12
import type Details from 'lighthouse/types/lhr/audit-details';
import {
  type Table,
  type TableRowObject,
  tableSchema,
  validate,
} from '@code-pushup/models';
import { formatBytes, formatDuration, html } from '@code-pushup/utils';
import { parseTableColumns, parseTableEntry } from './table.type.js';
import { LighthouseAuditDetailsParsingError } from './utils.js';

export function parseOpportunityToAuditDetailsTable(
  details: Details.Opportunity,
): Table | undefined {
  const { headings, items } = details;

  if (items.length === 0) {
    return undefined;
  }

  try {
    return validate(tableSchema(), {
      title: 'Opportunity',
      columns: parseTableColumns(headings),
      rows: items.map((row: any) =>
        parseOpportunityItemToTableRow(row, headings),
      ),
    });
  } catch (error) {
    throw new LighthouseAuditDetailsParsingError(
      'opportunity',
      { items, headings },
      error,
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
      return parseTableEntry([key as string, value], valueType);
  }
}
