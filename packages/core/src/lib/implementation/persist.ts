import ansis from 'ansis';
import { mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Format, PersistConfig, Report } from '@code-pushup/models';
import {
  type ScoredReport,
  createReportPath,
  directoryExists,
  formatBytes,
  generateMdReport,
  logger,
  stringifyError,
} from '@code-pushup/utils';

type FileSize = {
  file: string;
  size: number;
};

export async function persistReport(
  report: Report,
  sortedScoredReport: ScoredReport,
  options: Required<Omit<PersistConfig, 'skipReports'>>,
): Promise<FileSize[]> {
  const { outputDir, filename, format } = options;

  // format report
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
      throw new Error(
        `Failed to create output directory in ${ansis.bold(outputDir)} - ${stringifyError(error)}`,
      );
    }
  }

  // write relevant format outputs to file system
  return Promise.all(
    results.map(result =>
      persistResult(
        createReportPath({ outputDir, filename, format: result.format }),
        result.content,
      ),
    ),
  );
}

function persistResult(reportPath: string, content: string): Promise<FileSize> {
  return (
    writeFile(reportPath, content)
      // return reportPath instead of void
      .then(() => stat(reportPath))
      .then((stats): FileSize => ({ file: reportPath, size: stats.size }))
      .catch((error: unknown) => {
        throw new Error(
          `Failed to save report in ${ansis.bold(reportPath)} - ${stringifyError(error)}`,
        );
      })
  );
}

export function logPersistedReport(reportFiles: FileSize[]) {
  logger.info(`Persisted report to file system:`);
  reportFiles.forEach(({ file, size }) => {
    const name = ansis.bold(path.relative(process.cwd(), file));
    const suffix = ansis.gray(`(${formatBytes(size)})`);
    logger.info(`• ${name} ${suffix}`);
  });
}
