import ansis from 'ansis';
import type { FormattedIcu } from 'lighthouse';
import type Details from 'lighthouse/types/lhr/audit-details';
import type { Result } from 'lighthouse/types/lhr/audit-result';
import type { AuditDetails } from '@code-pushup/models';
import { logger } from '@code-pushup/utils';
import { parseCriticalRequestChainToAuditDetails } from './critical-request-chain.type.js';
import { parseOpportunityToAuditDetailsTable } from './opportunity.type.js';
import { parseTableToAuditDetailsTable } from './table.type.js';
import { parseTreemapDataToBasicTrees } from './treemap-data.type.js';

export function toAuditDetails<T extends FormattedIcu<Details>>(
  details: T | undefined,
): AuditDetails {
  if (details == null) {
    return {};
  }

  const { type } = details;

  switch (type) {
    case 'table':
      const table = parseTableToAuditDetailsTable(details);
      return table ? { table } : {};
    case 'opportunity':
      const opportunity = parseOpportunityToAuditDetailsTable(details);
      return opportunity ? { table: opportunity } : {};
    case 'criticalrequestchain':
      return parseCriticalRequestChainToAuditDetails(details);
    case 'treemap-data':
      const trees = parseTreemapDataToBasicTrees(details);
      return { trees };

    // TODO: add 'list' once array of tables supported in audit details

    // TODO: add 'screenshot' and 'filmstrip' once images supported in audit details
  }
  return {};
}

// @TODO implement all details
export const unsupportedDetailTypes = new Set<Details['type']>([
  'list',
  'debugdata',
  'screenshot',
  'filmstrip',
]);

export function logUnsupportedDetails(lhrAudits: Result[]) {
  const slugsWithDetailParsingErrors = [
    ...new Set(
      lhrAudits
        .filter(
          ({ details }) => details && unsupportedDetailTypes.has(details.type),
        )
        .map(({ details }) => details?.type),
    ),
  ];
  if (slugsWithDetailParsingErrors.length > 0) {
    logger.warn(
      `Skipped parsing of unsupported audit details: ${ansis.bold(
        slugsWithDetailParsingErrors.join(', '),
      )}.`,
    );
  }
}
