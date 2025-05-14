import { bold, yellow } from 'ansis';
import type { FormattedIcu } from 'lighthouse';
import type Details from 'lighthouse/types/lhr/audit-details';
import type { Result } from 'lighthouse/types/lhr/audit-result';
import type { AuditDetails, Table } from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import { PLUGIN_SLUG } from '../constants.js';
import { parseCriticalRequestChainToAuditDetails } from './critical-request-chain.type.js';
import { parseOpportunityToAuditDetailsTable } from './opportunity.type.js';
import { parseTableToAuditDetailsTable } from './table.type.js';

export function toAuditDetails<T extends FormattedIcu<Details>>(
  details: T | undefined,
): AuditDetails {
  if (details == null) {
    return {};
  }

  const { type } = details;

  switch (type) {
    case 'table':
      const table: Table | undefined = parseTableToAuditDetailsTable(details);
      return table ? { table } : {};
    case 'opportunity':
      const opportunity: Table | undefined =
        parseOpportunityToAuditDetailsTable(details);
      return opportunity ? { table: opportunity } : {};
    case 'criticalrequestchain':
      return parseCriticalRequestChainToAuditDetails(details);
    case 'treemap-data': // TODO: implement

    // TODO: add 'list' once array of tables supported in audit details

    // TODO: add 'screenshot' and 'filmstrip' once images supported in audit details
  }
  return {};
}

// @TODO implement all details
export const unsupportedDetailTypes = new Set([
  'debugdata',
  'screenshot',
  'filmstrip',
]);

export function logUnsupportedDetails(lhrAudits: Result[]) {
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
    ui().logger.debug(
      `${yellow('⚠')} Plugin ${bold(
        PLUGIN_SLUG,
      )} skipped parsing of unsupported audit details: ${bold(
        slugsWithDetailParsingErrors.join(', '),
      )}.`,
    );
  }
}
