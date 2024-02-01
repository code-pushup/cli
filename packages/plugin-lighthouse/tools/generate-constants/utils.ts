import type { Result } from 'lighthouse';
import { unlink } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  ensureDirectoryExists,
  executeProcess,
  readJsonFile,
} from '@code-pushup/utils';
import { getLighthouseCliArguments } from '../../src/lib/utils';

export async function getExampleReport(options?: {
  deleteFile: boolean;
}): Promise<Result> {
  const { deleteFile = true } = options;
  const outputPath = join('tmp', 'example-lh-report-for-tooling-script.json');

  await ensureDirectoryExists(dirname(outputPath));

  await executeProcess({
    command: 'npx',
    args: getLighthouseCliArguments({
      url: 'chrome://settings',
      outputPath,
      headless: 'new',
    }),
  });

  const report = await readJsonFile<Result>(outputPath);
  if (deleteFile) {
    await unlink(outputPath);
  }
  return report;
}
