import { existsSync, mkdirSync, statSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { CoreConfig, Report } from '@quality-metrics/models';
import { reportToStdout } from './report-to-stdout';
import { reportToMd } from './report-to-md';
import { formatBytes } from './utils';
import chalk from 'chalk';

export class PersistDirError extends Error {
  constructor(outputPath: string) {
    super(`outPath: ${outputPath} is no directory.`);
  }
}

export class PersistError extends Error {
  constructor(reportPath: string) {
    super(`fileName: ${reportPath} could not be saved.`);
  }
}

export type PersistResult = PromiseSettledResult<readonly [string, number]>[];

export async function persistReport(
  report: Report,
  config: CoreConfig,
): Promise<PersistResult> {
  const { persist } = config;
  const outputPath = persist.outputPath;
  let { format } = persist;
  format = format && format.length !== 0 ? format : ['stdout'];

  if (format.includes('stdout')) {
    reportToStdout(report);
  }

  // collect physical format outputs
  const results: { format: string; content: string }[] = [
    // JSON is always persisted
    { format: 'json', content: JSON.stringify(report, null, 2) },
  ];

  if (format.includes('md')) {
    results.push({ format: 'md', content: reportToMd(report) });
  }

  if (!existsSync(outputPath)) {
    try {
      mkdirSync(outputPath, { recursive: true });
    } catch (e) {
      console.warn(e);
      throw new PersistDirError(outputPath);
    }
  }

  // write relevant format outputs to file system
  return Promise.allSettled(
    results.map(({ format, content }) => {
      const reportPath = join(outputPath, `report.${format}`);

      return (
        writeFile(reportPath, content)
          // return reportPath instead of void
          .then(() => {
            const stats = statSync(reportPath);
            return [reportPath, stats.size] as const;
          })
          .catch(e => {
            console.warn(e);
            throw new PersistError(reportPath);
          })
      );
    }),
  );
}

export function logPersistedResults(persistResult: PersistResult) {
  const succeededPersitedResults = persistResult.filter(
    result => result.status === 'fulfilled',
  );

  if (succeededPersitedResults.length) {
    console.log(`Generated reports successfully: `);
    succeededPersitedResults.forEach(res => {
      const [fileName, size] = (res as PromiseFulfilledResult<[string, number]>)
        .value;
      console.log(
        `- ${chalk.bold(fileName)} (${chalk.gray(formatBytes(size))})`,
      );
    });
  }

  const failedPersitedResults = persistResult.filter(
    result => result.status === 'rejected',
  );

  if (failedPersitedResults.length) {
    console.log(`Generated reports failed: `);
    failedPersitedResults.forEach(result => {
      console.log(`- ${chalk.bold((result as PromiseRejectedResult).reason)}`);
    });
  }
}
