import type {FormattedIcu} from "lighthouse";
import Details from "lighthouse/types/lhr/audit-details";
import {AuditDetails, TableAlignment, TableRow, tableSchema} from "@code-pushup/models";
import {formatBytes, formatDuration, normalizeTable, ui} from "@code-pushup/utils";
import {Result} from "lighthouse/types/lhr/audit-result";
import chalk from "chalk";
import {PLUGIN_SLUG} from "../constants";
import {parseOpportunityDetails} from "./opportunity.type";
import {parseType} from "./types";

export function toAuditDetails<T extends FormattedIcu<Details>>(
  details: T | undefined,
): AuditDetails {
  const {type} = details ?? {};

  if (type === 'opportunity') {
    return parseOpportunityDetails(details as Details.Opportunity);
  }

  if (type === 'table' as any) {
    const {headings, items} = details as Details.Table;
    if (items.length == 0) {
      return {};
    }
    const result = tableSchema().safeParse(normalizeTable({
      headings: headings.map(({key, label}) => ({
        key: key ?? '',
        label: typeof label === 'string' ? label : undefined,
      })),
      rows: items.map((row, rowIxd) => {
        return Object.fromEntries(Object.entries(row).filter(i => Boolean(i.at(1))).map(([key, value]) => ([key, parseType(value as Record<string, any>, headings?.at(rowIxd))])))
      })
    }));

    if (result.success) {
      return {
        table: result.data
      }
    } else {
      throw new Error(`Parsing details ${chalk.bold('table')} failed: \n${result.error.toString()}`);
    }
  }

  return {};
}

// @TODO implement all details
export const unsupportedDetailTypes = new Set([
  'debugdata',
  'treemap-data',
  'screenshot',
  'filmstrip',
  'criticalrequestchain',
]);

export function logUnsupportedDetails(
  lhrAudits: Result[],
  {displayCount = 3}: { displayCount?: number } = {},
) {
  const slugsWithDetailParsingErrors = [
    ...new Set(
      lhrAudits
        .filter(({details}) =>
          unsupportedDetailTypes.has(details?.type as string),
        )
        .map(({details}) => details?.type),
    ),
  ];
  if (slugsWithDetailParsingErrors.length > 0) {
    const postFix = (count: number) =>
      count > displayCount ? ` and ${count - displayCount} more.` : '';
    ui().logger.debug(
      `${chalk.yellow('⚠')} Plugin ${chalk.bold(
        PLUGIN_SLUG,
      )} skipped parsing of unsupported audit details: ${chalk.bold(
        slugsWithDetailParsingErrors.slice(0, displayCount).join(', '),
      )}${postFix(slugsWithDetailParsingErrors.length)}`,
    );
  }
}
