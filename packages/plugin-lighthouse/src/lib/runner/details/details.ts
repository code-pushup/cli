import chalk from 'chalk';
import type { FormattedIcu } from 'lighthouse';
import type Details from 'lighthouse/types/lhr/audit-details';
import { Result } from 'lighthouse/types/lhr/audit-result';
import { AuditDetails, Table } from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import { PLUGIN_SLUG } from '../constants';
import { parseTableToAuditDetailsTable } from './table.type';

export function toAuditDetails<T extends FormattedIcu<Details>>(
  details: T | undefined,
): AuditDetails {
  if (details == null) {
    return {};
  }

  const { type } = details;

  switch (type) {
    case 'table':
      const rawTable: Table | undefined =
        parseTableToAuditDetailsTable(details);
      return rawTable ? { table: rawTable } : {};
    default:
      return {};
  }
}

// @TODO implement all details
export const unsupportedDetailTypes = new Set([
  'opportunity',
  'debugdata',
  'treemap-data',
  'screenshot',
  'filmstrip',
  'criticalrequestchain',
]);

export function logUnsupportedDetails(
  lhrAudits: Result[],
  { displayCount = 3 }: { displayCount?: number } = {},
) {
  const slugsWithDetailParsingErrors = [
    ...new Set(
      lhrAudits
        .filter(({ details }) =>
          unsupportedDetailTypes.has(details?.type as string),
        )
        .map(({ details }) => details?.type),
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
