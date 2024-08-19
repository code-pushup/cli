import { writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { PersistConfig, reportsDiffSchema } from '@code-pushup/models';
import {
  ensureDirectoryExists,
  generateMdReportsDiffForMonorepo,
  isPromiseFulfilledResult,
  isPromiseRejectedResult,
  readJsonFile,
  stringifyError,
  ui,
} from '@code-pushup/utils';

export async function mergeDiffs(
  files: string[],
  persistConfig: Required<PersistConfig>,
): Promise<string> {
  const results = await Promise.allSettled(
    files.map(async file => {
      const json = await readJsonFile(file).catch((error: unknown) => {
        throw new Error(
          `Failed to read JSON file ${file} - ${stringifyError(error)}`,
        );
      });
      const result = await reportsDiffSchema.safeParseAsync(json);
      if (!result.success) {
        throw new Error(
          `Invalid reports diff in ${file} - ${result.error.message}`,
        );
      }
      return { ...result.data, file };
    }),
  );
  results.filter(isPromiseRejectedResult).forEach(({ reason }) => {
    ui().logger.warning(
      `Skipped invalid report diff - ${stringifyError(reason)}`,
    );
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
