import { z } from 'zod';
import { filenameRegex, slugRegex } from './utils';

/**
 * Schema for execution meta date
 */
export function executionMetaSchema(
  options: {
    descriptionDate: string;
    descriptionDuration: string;
  } = {
    descriptionDate: 'Execution start date and time',
    descriptionDuration: 'Execution duration in ms',
  },
) {
  return z.object({
    date: z.string({ description: options.descriptionDate }),
    duration: z.number({ description: options.descriptionDuration }),
  });
}

/**
 * Schema for a slug of a categories, plugins or audits.
 * @param description
 */
export function slugSchema(
  description = 'Unique ID (human-readable, URL-safe)',
) {
  return z
    .string({ description })
    .regex(slugRegex, {
      message:
        'The slug has to follow the pattern [0-9a-z] followed by multiple optional groups of -[0-9a-z]. e.g. my-slug',
    })
    .max(128, {
      message: 'slug can be max 128 characters long',
    });
}

/**
 * Schema for a general description property
 * @param description
 */
export function descriptionSchema(description = 'Description (markdown)') {
  return z.string({ description }).max(65536).optional();
}

/**
 * Schema for a docsUrl
 * @param description
 */
export function docsUrlSchema(description = 'Documentation site') {
  return urlSchema(description).optional().or(z.string().max(0)); // allow empty string (no URL validation)
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
export function titleSchema(description = 'Descriptive name') {
  return z.string({ description }).max(256);
}

/**
 * Used for categories, plugins and audits
 * @param options
 */
export function metaSchema(options?: {
  titleDescription?: string;
  descriptionDescription?: string;
  docsUrlDescription?: string;
  description?: string;
}) {
  const {
    descriptionDescription,
    titleDescription,
    docsUrlDescription,
    description,
  } = options || {};
  return z.object(
    {
      title: titleSchema(titleDescription),
      description: descriptionSchema(descriptionDescription),
      docsUrl: docsUrlSchema(docsUrlDescription),
    },
    { description },
  );
}

/**
 * Schema for a generalFilePath
 * @param description
 */
export function filePathSchema(description: string) {
  return z
    .string({ description })
    .trim()
    .min(1, { message: 'path is invalid' });
}

/**
 * Schema for a fileNameSchema
 * @param description
 */
export function fileNameSchema(description: string) {
  return z
    .string({ description })
    .trim()
    .regex(filenameRegex, {
      message: `The filename has to be valid`,
    })
    .min(1, { message: 'file name is invalid' });
}

/**
 * Schema for a positiveInt
 * @param description
 */
export function positiveIntSchema(description: string) {
  return z.number({ description }).int().nonnegative();
}

export function packageVersionSchema(options?: {
  versionDescription?: string;
  optional?: boolean;
}) {
  let { versionDescription, optional } = options || {};
  versionDescription = versionDescription || 'NPM version of the package';
  optional = !!optional;
  const packageSchema = z.string({ description: 'NPM package name' });
  const versionSchema = z.string({ description: versionDescription });
  return z.object(
    {
      packageName: optional ? packageSchema.optional() : packageSchema,
      version: optional ? versionSchema.optional() : versionSchema,
    },
    { description: 'NPM package name and version of a published package' },
  );
}

/**
 * Schema for a weight
 * @param description
 */
export function weightSchema(
  description = 'Coefficient for the given score (use weight 0 if only for display)',
) {
  return positiveIntSchema(description);
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
