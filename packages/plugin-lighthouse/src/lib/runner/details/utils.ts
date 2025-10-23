import { bold } from 'ansis';
import type Details from 'lighthouse/types/lhr/audit-details';
import { stringifyError } from '@code-pushup/utils';

export class LighthouseAuditDetailsParsingError extends Error {
  constructor(
    type: Details['type'],
    rawTable: Record<string, unknown>,
    error: unknown,
  ) {
    super(
      `Parsing lighthouse report details ${bold(
        type,
      )} failed: \nRaw data:\n ${JSON.stringify(rawTable, null, 2)}\n${stringifyError(error)}`,
    );
  }
}
