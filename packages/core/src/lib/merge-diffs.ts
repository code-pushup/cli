import { writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { PersistConfig, reportsDiffSchema } from '@code-pushup/models';
import {
  ensureDirectoryExists,
  generateMdReportsDiffForMonorepo,
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
  readJsonFile,
  ui,
} from '@code-pushup/utils';

export async function mergeDiffs(
  files: string[],
  persistConfig: Required<PersistConfig>,
): Promise<string> {
  const results = await Promise.allSettled(
    files.map(async file => {
      const json = await readJsonFile(file);
      const diff = await reportsDiffSchema.parseAsync(json);
      return { ...diff, file };
    }),
  );
  results.filter(isPromiseRejectedResult).forEach(({ reason }) => {
    ui().logger.warning(`Failed to parse report diff file - ${reason}`);
  });
  const diffs = results
    .filter(isPromiseFulfilledResult)
    .map(({ value }) => value);

  const labeledDiffs = diffs.map(diff => ({
    ...diff,
    label: diff.label || basename(dirname(diff.file)), // fallback is parent folder name
  }));

  const markdown = generateMdReportsDiffForMonorepo(labeledDiffs);

  const { outputDir, filename } = persistConfig;
  const outputPath = join(outputDir, `${filename}-diff.md`);
  await ensureDirectoryExists(outputDir);
  await writeFile(outputPath, markdown);

  return outputPath;
}
