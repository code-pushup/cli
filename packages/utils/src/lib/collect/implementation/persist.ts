import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { CoreConfig, Report } from '@quality-metrics/models';
import { reportToStdout } from './report-to-stdout';
import { reportToMd } from './report-to-md';

export class PersistDirError extends Error {
  constructor(outputPath: string) {
    super(`outPath: ${outputPath} is no directory`);
  }
}

export class PersistError extends Error {
  constructor(fileName: string) {
    super(`fileName: ${fileName} could not be saved`);
  }
}

export async function persistReport(report: Report, config: CoreConfig) {
  const { persist } = config;
  const outputPath = persist.outputPath;
  let { format } = persist;
  format = format && format.length !== 0 ? format : ['stdout'];

  if (!existsSync(outputPath)) {
    try {
      mkdirSync(outputPath, { recursive: true });
    } catch (e) {
      throw new PersistDirError(outputPath);
    }
  }

  if (format.includes('stdout')) {
    reportToStdout(report, config);
  }

  // collect physical format outputs
  const results: { format: string; out: string }[] = [];

  if (format.includes('json')) {
    results.push({ format: 'json', out: JSON.stringify(report, null, 2) });
  }

  if (format.includes('md')) {
    results.push({ format: 'md', out: reportToMd(report, config) });
  }

  // write format outputs
  return Promise.allSettled(
    results.map(({ format, out }) => {
      const filePath = join(`${outputPath}.${format}`);
      return writeFile(filePath, out)
        .then(() => filePath)
        .catch(() => {
          throw new PersistError(filePath);
        });
    }),
  );
}
