import { existsSync, mkdirSync } from 'fs';
import { stat, writeFile } from 'fs/promises';
import { join } from 'path';
import { PersistConfig, Report } from '@code-pushup/models';
import {
  MultipleFileResults,
  getLatestCommit,
  logMultipleFileResults,
  reportToMd,
  reportToStdout,
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
  options: Required<PersistConfig>,
): Promise<MultipleFileResults> {
  const { outputDir, filename, format } = options;

  let scoredReport;

  // collect physical format outputs
  const results: { format: string; content: string }[] = [];

  if (format.includes('json')) {
    scoredReport = scoreReport(report);

    results.push({
      format: 'json',
      content: JSON.stringify(report, null, 2),
    });
  }

  if (format.includes('md')) {
    scoredReport = scoredReport || scoreReport(report);
    const commitData = await getLatestCommit();
    validateCommitData(commitData);

    results.push({
      format: 'md',
      content: reportToMd(scoredReport, commitData),
    });
  }

  scoredReport = scoredReport || scoreReport(report);
  console.info(reportToStdout(scoredReport));

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

function validateCommitData(commitData?: unknown) {
  if (!commitData) {
    console.warn('no commit data available');
  }
}
