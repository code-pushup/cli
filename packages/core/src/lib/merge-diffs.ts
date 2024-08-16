import { PersistConfig, reportsDiffSchema } from '@code-pushup/models';
import { readJsonFile } from '@code-pushup/utils';

export async function mergeDiffs(
  files: string[],
  persistConfig: Required<PersistConfig>,
): Promise<string> {
  const diffs = await Promise.all(
    files.map(file => readJsonFile(file).then(reportsDiffSchema.parseAsync)),
  );
  // TODO: implement
  return '<path>';
}
