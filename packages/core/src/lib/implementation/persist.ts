import { mkdir, stat, writeFile } from 'node:fs/promises';
import type { Format, PersistConfig, Report } from '@code-pushup/models';
import {
  type MultipleFileResults,
  type ScoredReport,
  createReportPath,
  directoryExists,
  generateMdReport,
  logMultipleFileResults,
  ui,
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
  sortedScoredReport: ScoredReport,
  options: Required<Omit<PersistConfig, 'skipReports'>>,
): Promise<MultipleFileResults> {
  const { outputDir, filename, format } = options;

  // collect physical format outputs
  const results = format.map(
    (reportType): { format: Format; content: string } => {
      switch (reportType) {
        case 'json':
          return {
            format: 'json',
            content: JSON.stringify(report, null, 2),
          };
        case 'md':
          return {
            format: 'md',
            content: generateMdReport(sortedScoredReport, { outputDir }),
          };
      }
    },
  );

  if (!(await directoryExists(outputDir))) {
    try {
      await mkdir(outputDir, { recursive: true });
    } catch (error) {
      ui().logger.warning((error as Error).toString());
      throw new PersistDirError(outputDir);
    }
  }

  // write relevant format outputs to file system
  return Promise.allSettled(
    results.map(result =>
      persistResult(
        createReportPath({ outputDir, filename, format: result.format }),
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
        ui().logger.warning((error as Error).toString());
        throw new PersistError(reportPath);
      })
  );
}

export function logPersistedResults(persistResults: MultipleFileResults) {
  logMultipleFileResults(persistResults, 'Generated reports');
}
