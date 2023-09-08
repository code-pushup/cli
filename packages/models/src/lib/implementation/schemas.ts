import { z } from 'zod';
import {
  generalFilePathRegex,
  refRegex,
  slugRegex,
  unixFilePathRegex,
} from './utils';

/**
 * Schema for a slug of a categories, plugins or audits.
 * @param description
 */
export function slugSchema(
  description = 'Unique ID (human-readable, URL-safe)',
) {
  return (
    z
      .string({ description })
      // also validates ``and ` `
      .regex(slugRegex, {
        message:
          'The slug has to follow the pattern [0-9a-z] followed by multiple optional groups of -[0-9a-z]. e.g. my-slug',
      })
      .max(128, {
        message: 'slug can be max 128 characters long',
      })
  );
}

/**
 * Schema for a reference to a plugin's audit in categories (e.g. 'eslint#max-lines')
 */
export function refSchema(description: string) {
  return (
    z
      .string({ description })
      // also validates ``and ` `
      .regex(refRegex, {
        message: 'The ref has to follow the pattern {plugin-slug}#{audit-slug}',
      })
      .max(256)
  );
}

/**
 * Schema for a general description property
 * @param description
 */
export function descriptionSchema(description: string) {
  return z.string({ description }).max(65536).optional();
}

/**
 * Schema for a docsUrl
 * @param description
 */
export function docsUrlSchema(description = 'Documentation site') {
  return urlSchema(description).optional();
}

/**
 * Schema for a URL
 * @param description
 */
export function urlSchema(description: string) {
  return z.string({ description }).url();
}

/**
 * Schema for a title of a plugin, category and audit
 * @param description
 */
export function titleSchema(description: string) {
  return z.string({ description }).max(128);
}

/**
 * Schema for a generalFilePath
 * @param description
 */
export function generalFilePathSchema(description: string) {
  return z.string({ description }).regex(generalFilePathRegex, {
    message: 'path is invalid',
  });
}

/**
 * Schema for a unixFilePath
 * @param description
 */
export function weightSchema(
  description = 'Coefficient for the given score (use weight 0 if only for display)',
) {
  return positiveIntSchema(description);
}

/**
 * Schema for a positiveInt
 * @param description
 */
export function positiveIntSchema(description: string) {
  return z.number({ description }).int().nonnegative();
}
/**
 * Schema for a unixFilePath
 * @param description
 */
export function unixFilePathSchema(description: string) {
  return z.string({ description }).regex(unixFilePathRegex);
}

export function weightedRefSchema(
  description: string,
  slugDescription: string,
) {
  return z.object(
    {
      slug: slugSchema(slugDescription),
      weight: weightSchema('Weight used to calculate score'),
    },
    { description },
  );
}

export function scorableSchema<T extends ReturnType<typeof weightedRefSchema>>(
  description: string,
  refSchema: T,
  duplicateCheckFn: (metrics: z.infer<T>[]) => false | string[],
  duplicateMessageFn: (metrics: z.infer<T>[]) => string,
) {
  return z.object(
    {
      slug: slugSchema('Human-readable unique ID, e.g. "performance"'),
      title: titleSchema('Display name'),
      description: descriptionSchema('Optional description in Markdown format'),
      refs: z
        .array(refSchema)
        // refs are unique
        .refine(
          refs => !duplicateCheckFn(refs),
          refs => ({
            message: duplicateMessageFn(refs),
          }),
        ),
    },
    { description },
  );
}
