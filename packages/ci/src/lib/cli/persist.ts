import { isAbsolute, join } from 'node:path';
import { z } from 'zod';
import {
  type CoreConfig,
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  type Format,
  persistConfigSchema,
} from '@code-pushup/models';
import { objectFromEntries, stringifyError } from '@code-pushup/utils';

export function persistedFilesFromConfig(
  config: Pick<CoreConfig, 'persist'>,
  { isDiff, directory }: { isDiff?: boolean; directory: string },
): Record<Format, string> {
  const {
    persist: {
      outputDir = DEFAULT_PERSIST_OUTPUT_DIR,
      filename = DEFAULT_PERSIST_FILENAME,
    } = {},
  } = config;

  const dir = isAbsolute(outputDir) ? outputDir : join(directory, outputDir);
  const name = isDiff ? `${filename}-diff` : filename;

  return objectFromEntries(
    DEFAULT_PERSIST_FORMAT.map(format => [
      format,
      join(dir, `${name}.${format}`),
    ]),
  );
}

export async function parsePersistConfig(
  json: unknown,
): Promise<Pick<CoreConfig, 'persist'>> {
  const schema = z.object({ persist: persistConfigSchema.optional() });
  const result = await schema.safeParseAsync(json);
  if (result.error) {
    throw new Error(`Invalid persist config - ${stringifyError(result.error)}`);
  }
  return result.data;
}
