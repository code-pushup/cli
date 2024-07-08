import { z } from 'zod';
import { persistConfigSchema, uploadConfigSchema } from '../../internal/schema';
import {
  baseExecutorSchema,
  executorOptionsUploadOnlySchema,
} from '../internal/schema';

export async function autorunExecutorOptionsSchema() {
  const uploadSchema = await uploadConfigSchema({
    optional: {
      server: true,
      organization: true,
      project: true,
      apiKey: true,
      timeout: true,
    },
  });
  return z
    .object({
      upload: (uploadSchema as any).optional(),
      persist: await persistConfigSchema(),
    })
    .merge(baseExecutorSchema)
    .merge(executorOptionsUploadOnlySchema);
}

export type AutorunCommandExecutorOptions = Partial<
  z.infer<Awaited<ReturnType<typeof autorunExecutorOptionsSchema>>>
>;
