import chalk from 'chalk';
import Details from 'lighthouse/types/lhr/audit-details';
import { Table } from '@code-pushup/models';

export class LighthouseAuditDetailsParsingError extends Error {
  constructor(type: Details['type'], rawTable: Table, error: string) {
    super(
      `Parsing lighthouse report details ${chalk.bold(
        type,
      )} failed: \nRaw data:\n ${JSON.stringify(rawTable, null, 2)}\n${error}`,
    );
  }
}
