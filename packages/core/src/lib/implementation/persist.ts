import { existsSync, mkdirSync } from 'fs';
import { stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { CoreConfig, Report } from '@code-pushup/models';
import {
  MultipleFileResults,
  getLatestCommit,
  logMultipleFileResults,
  reportToMd,
//  reportToStdout,
  scoreReport,
} from '@code-pushup/utils';

export class PersistDirError extends Error {
  constructor(outputDir: string) {
    super(`outPath: ${outputDir} is no directory.`);
  }
}

export class PersistError extends Error {
  constructor(reportPath: string) {
    super(`fileName: ${reportPath} could not be saved.`);
  }
}

export async function persistReport(
  report: Report,
  config: CoreConfig,
): Promise<MultipleFileResults> {
  const { persist } = config;
  console.log('persist: ', persist);
  const outputDir = persist.outputDir;
  const filename = persist.filename;
  const format = persist.format ?? [];

  let scoredReport = scoreReport(report);
  //console.info(reportToStdout(scoredReport));

  // collect physical format outputs
  const results: { format: string; content: string }[] = [
    // JSON is always persisted
    { format: 'json', content: JSON.stringify(report, null, 2) },
  ];

  if (format.includes('md')) {
    scoredReport = scoredReport || scoreReport(report);
    const commitData = await getLatestCommit();
    if (!commitData) {
      console.warn('no commit data available');
    }
    results.push({
      format: 'md',
      content: reportToMd(scoredReport, commitData),
    });
  }

  if (!existsSync(outputDir)) {
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      console.warn(e);
      throw new PersistDirError(outputDir);
    }
  }

  // write relevant format outputs to file system
  return Promise.allSettled(
    results.map(({ format, content }) => {
      const reportPath = join(outputDir, `${filename}.${format}`);

      return (
        writeFile(reportPath, content)
          // return reportPath instead of void
          .then(() => stat(reportPath))
          .then(stats => [reportPath, stats.size] as const)
          .catch(e => {
            console.warn(e);
            throw new PersistError(reportPath);
          })
      );
    }),
  );
}

export function logPersistedResults(persistResults: MultipleFileResults) {
  logMultipleFileResults(persistResults, 'Generated reports');
}
