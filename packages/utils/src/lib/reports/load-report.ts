import path from 'node:path';
import {
  type Format,
  type PersistConfig,
  type Report,
  reportSchema,
  validate,
} from '@code-pushup/models';
import {
  ensureDirectoryExists,
  readJsonFile,
  readTextFile,
} from '../file-system.js';

type LoadedReportFormat<T extends Format> = T extends 'json' ? Report : string;

export async function loadReport<T extends Format>(
  options: Required<Omit<PersistConfig, 'format'>> & {
    format: T;
  },
): Promise<LoadedReportFormat<T>> {
  const { outputDir, filename, format } = options;
  await ensureDirectoryExists(outputDir);
  const filePath = path.join(outputDir, `${filename}.${format}`);

  if (format === 'json') {
    const content = await readJsonFile(filePath);
    const report: Report = validate(reportSchema, content);
    return report as LoadedReportFormat<T>;
  }

  const text: string = await readTextFile(filePath);
  return text as LoadedReportFormat<T>;
}
