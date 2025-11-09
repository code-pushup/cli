import { ZodError, z } from 'zod';
import {
  DEFAULT_PERSIST_CONFIG,
  persistConfigSchema,
  slugSchema,
  uploadConfigSchema,
} from '@code-pushup/models';
import { interpolate } from '@code-pushup/utils';

// eslint-disable-next-line unicorn/prefer-top-level-await, unicorn/catch-error-name
export const interpolatedSlugSchema = slugSchema.catch(ctx => {
  // allow {projectName} interpolation (invalid slug)
  if (
    typeof ctx.value === 'string' &&
    ctx.issues.length === 1 &&
    ctx.issues[0]?.code === 'invalid_format'
  ) {
    // if only regex failed, try if it would pass once we insert known variables
    const { success } = slugSchema.safeParse(
      interpolate(ctx.value, { projectName: 'example' }),
    );
    if (success) {
      return ctx.value;
    }
  }
  throw new ZodError(ctx.error.issues);
});

export const configPatternsSchema = z
  .object({
    persist: persistConfigSchema.transform(persist => ({
      ...DEFAULT_PERSIST_CONFIG,
      ...persist,
    })),
    upload: uploadConfigSchema
      .omit({ organization: true, project: true })
      .extend({
        organization: interpolatedSlugSchema,
        project: interpolatedSlugSchema,
      })
      .optional(),
  })
  .meta({ title: 'ConfigPatterns' });
