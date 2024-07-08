import { z } from 'zod';
import type { UploadSchemaConfig } from '@code-pushup/models';

// This model does not exist in the CLI source code as we don't expose any logic in this package.
// Only types is used to define the global options used in the cli and core packages.
// therefore we maintain the model here.
export const globalCliOptionsSchema = z.object({
  progress: z.boolean().describe('show progress').optional(),
  verbose: z.boolean().describe('additional information').optional(),
});

export const uploadConfigSchema = async (opt?: UploadSchemaConfig) =>
  await import('@code-pushup/models').then(({ uploadConfigSchema: schema }) =>
    schema(opt),
  );

export const persistConfigSchema = async () =>
  await import('@code-pushup/models').then(
    ({ persistConfigSchema: schema }) => schema,
  );
