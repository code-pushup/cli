import { join } from 'node:path';
import {
  type Format,
  type PersistConfig,
  type Report,
  reportSchema,
} from '@code-pushup/models';
import {
  ensureDirectoryExists,
  readJsonFile,
  readTextFile,
} from '../file-system';

type LoadedReportFormat<T extends Format> = T extends 'json' ? Report : string;

export async function loadReport<T extends Format>(
  options: Required<Omit<PersistConfig, 'format'>> & {
    format: T;
  },
): Promise<LoadedReportFormat<T>> {
  const { outputDir, filename, format } = options;
  await ensureDirectoryExists(outputDir);
  const filePath = join(outputDir, `${filename}.${format}`);

  if (format === 'json') {
    const content = await readJsonFile(filePath);
    return reportSchema.parse(content) as LoadedReportFormat<T>;
  }

  const text = await readTextFile(filePath);
  return text as LoadedReportFormat<T>;
}
