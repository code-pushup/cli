import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_PERSIST_FILENAME, type Format } from '@code-pushup/models';
import { logger, objectFromEntries, objectToKeys } from '@code-pushup/utils';
import type { OutputFiles, Settings } from './models.js';
import type { ProjectConfig } from './monorepo/tools.js';

const BASE_DIR = path.join('.code-pushup', '.ci');

type OutputType = 'current' | 'previous' | 'comparison';

export async function saveOutputFiles<T extends Partial<OutputFiles>>({
  project,
  type,
  files,
  settings: { directory },
}: {
  project: Pick<ProjectConfig, 'name'> | null;
  type: OutputType;
  files: T;
  settings: Pick<Settings, 'directory'>;
}): Promise<T> {
  const baseDir = project ? path.join(BASE_DIR, project.name) : BASE_DIR;
  const outputDir = path.join(directory, baseDir, `.${type}`);
  const name =
    type === 'comparison'
      ? `${DEFAULT_PERSIST_FILENAME}-diff`
      : DEFAULT_PERSIST_FILENAME;

  const formats = objectToKeys(files) as Format[];
  const outputs = objectFromEntries(
    formats.map(format => [
      format,
      path.join(outputDir, `${name}.${format.toString()}`),
    ]),
  );

  if (formats.length > 0) {
    await mkdir(outputDir, { recursive: true });
  }

  await Promise.all(
    formats.map(async format => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const src = files[format]!;
      const dest = outputs[format];
      await copyFile(src, dest);
      logger.debug(`Copied ${type} report from ${src} to ${dest}`);
    }),
  );

  return outputs as T;
}
