import { mkdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PersistConfig, Report } from '@code-pushup/models';
import {
  MultipleFileResults,
  directoryExists,
  generateMdReport,
  generateStdoutSummary,
  getLatestCommit,
  logMultipleFileResults,
  scoreReport,
  sortReport,
  validateCommitData,
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

  const sortedScoredReport = sortReport(scoreReport(report));
  console.info(generateStdoutSummary(sortedScoredReport));

  // collect physical format outputs
  const results = await Promise.all(
    format.map(async reportType => {
      switch (reportType) {
        case 'json':
          return {
            format: 'json',
            content: JSON.stringify(report, null, 2),
          };
        case 'md':
          const commitData = await getLatestCommit();
          validateCommitData(commitData);
          return {
            format: 'md',
            content: generateMdReport(sortedScoredReport, commitData),
          };
      }
    }),
  );

  if (!(await directoryExists(outputDir))) {
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      console.warn(error);
      throw new PersistDirError(outputDir);
    }
  }

  // write relevant format outputs to file system
  return Promise.allSettled(
    results.map(result =>
      persistResult(
        join(outputDir, `${filename}.${result.format}`),
        result.content,
      ),
    ),
  );
}

async function persistResult(reportPath: string, content: string) {
  return (
    writeFile(reportPath, content)
      // return reportPath instead of void
      .then(() => stat(reportPath))
      .then(stats => [reportPath, stats.size] as const)
      .catch(error => {
        console.warn(error);
        throw new PersistError(reportPath);
      })
  );
}

export function logPersistedResults(persistResults: MultipleFileResults) {
  logMultipleFileResults(persistResults, 'Generated reports');
}
