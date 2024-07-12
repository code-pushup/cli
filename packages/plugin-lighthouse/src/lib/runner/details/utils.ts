import chalk from 'chalk';
import Details from 'lighthouse/types/lhr/audit-details';

export class LighthouseAuditDetailsParsingError extends Error {
  constructor(
    type: Details['type'],
    rawTable: Record<string, unknown>,
    error: string,
  ) {
    super(
      `Parsing lighthouse report details ${chalk.bold(
        type,
      )} failed: \nRaw data:\n ${JSON.stringify(rawTable, null, 2)}\n${error}`,
    );
  }
}
