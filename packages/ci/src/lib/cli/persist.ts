import path from 'node:path';
import { z } from 'zod';
import {
  type CoreConfig,
  DEFAULT_PERSIST_FILENAME,
  DEFAULT_PERSIST_FORMAT,
  DEFAULT_PERSIST_OUTPUT_DIR,
  type Format,
  persistConfigSchema,
  uploadConfigSchema,
} from '@code-pushup/models';
import { createReportPath, objectFromEntries } from '@code-pushup/utils';

export type EnhancedPersistConfig = Pick<CoreConfig, 'persist' | 'upload'>;

export function persistedFilesFromConfig(
  config: EnhancedPersistConfig,
  { isDiff, directory }: { isDiff?: boolean; directory: string },
): Record<Format, string> {
  const {
    persist: {
      outputDir = DEFAULT_PERSIST_OUTPUT_DIR,
      filename = DEFAULT_PERSIST_FILENAME,
    } = {},
  } = config;

  const dir = path.isAbsolute(outputDir)
    ? outputDir
    : path.join(directory, outputDir);
  const suffix = isDiff ? 'diff' : undefined;

  return objectFromEntries(
    DEFAULT_PERSIST_FORMAT.map(format => [
      format,
      createReportPath({ outputDir: dir, filename, format, suffix }),
    ]),
  );
}

export async function parsePersistConfig(
  json: unknown,
): Promise<EnhancedPersistConfig> {
  const schema = z.object({
    persist: persistConfigSchema.optional(),
    upload: uploadConfigSchema.optional(),
  });
  const result = await schema.safeParseAsync(json);
  if (result.error) {
    throw new Error(
      `Code PushUp config is invalid:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
