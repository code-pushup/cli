import { MATERIAL_ICONS } from 'vscode-material-icons';
import { type ZodObject, type ZodOptional, type ZodString, z } from 'zod';
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_SLUG_LENGTH,
  MAX_TITLE_LENGTH,
} from './limits.js';
import { filenameRegex, slugRegex } from './utils.js';

export const tableCellValueSchema = z
  .union([z.string(), z.number(), z.boolean(), z.null()])
  .default(null);
export type TableCellValue = z.infer<typeof tableCellValueSchema>;

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

/** Schema for a slug of a categories, plugins or audits. */
export const slugSchema = z
  .string({ description: 'Unique ID (human-readable, URL-safe)' })
  .regex(slugRegex, {
    message:
      'The slug has to follow the pattern [0-9a-z] followed by multiple optional groups of -[0-9a-z]. e.g. my-slug',
  })
  .max(MAX_SLUG_LENGTH, {
    message: `The slug can be max ${MAX_SLUG_LENGTH} characters long`,
  });

/**  Schema for a general description property */
export const descriptionSchema = z
  .string({ description: 'Description (markdown)' })
  .max(MAX_DESCRIPTION_LENGTH)
  .optional();

/* Schema for a URL */
export const urlSchema = z.string().url();

/**  Schema for a docsUrl */
export const docsUrlSchema = urlSchema
  .optional()
  .or(z.literal('')) // allow empty string (no URL validation)
  // eslint-disable-next-line unicorn/prefer-top-level-await, unicorn/catch-error-name
  .catch(ctx => {
    // if only URL validation fails, supress error since this metadata is optional anyway
    if (
      ctx.error.errors.length === 1 &&
      ctx.error.errors[0]?.code === 'invalid_string' &&
      ctx.error.errors[0].validation === 'url'
    ) {
      console.warn(`Ignoring invalid docsUrl: ${ctx.input}`);
      return '';
    }
    throw ctx.error;
  })
  .describe('Documentation site');

/** Schema for a title of a plugin, category and audit */
export const titleSchema = z
  .string({ description: 'Descriptive name' })
  .max(MAX_TITLE_LENGTH);

/** Schema for score of audit, category or group */
export const scoreSchema = z
  .number({
    description: 'Value between 0 and 1',
  })
  .min(0)
  .max(1);

/** Schema for a property indicating whether an entity is filtered out */
export const isSkippedSchema = z.boolean().optional();

/**
 * Used for categories, plugins and audits
 * @param options
 */
export function metaSchema(options?: {
  titleDescription?: string;
  descriptionDescription?: string;
  docsUrlDescription?: string;
  description?: string;
  isSkippedDescription?: string;
}) {
  const {
    descriptionDescription,
    titleDescription,
    docsUrlDescription,
    description,
    isSkippedDescription,
  } = options ?? {};
  return z.object(
    {
      title: titleDescription
        ? titleSchema.describe(titleDescription)
        : titleSchema,
      description: descriptionDescription
        ? descriptionSchema.describe(descriptionDescription)
        : descriptionSchema,
      docsUrl: docsUrlDescription
        ? docsUrlSchema.describe(docsUrlDescription)
        : docsUrlSchema,
      isSkipped: isSkippedDescription
        ? isSkippedSchema.describe(isSkippedDescription)
        : isSkippedSchema,
    },
    { description },
  );
}

/** Schema for a generalFilePath */
export const filePathSchema = z
  .string()
  .trim()
  .min(1, { message: 'The path is invalid' });

/** Schema for a fileNameSchema */
export const fileNameSchema = z
  .string()
  .trim()
  .regex(filenameRegex, {
    message: `The filename has to be valid`,
  })
  .min(1, { message: 'The file name is invalid' });

/** Schema for a positiveInt */
export const positiveIntSchema = z.number().int().positive();

export const nonnegativeNumberSchema = z.number().nonnegative();

export function packageVersionSchema<TRequired extends boolean>(options?: {
  versionDescription?: string;
  required?: TRequired;
}) {
  const { versionDescription = 'NPM version of the package', required } =
    options ?? {};
  const packageSchema = z.string({ description: 'NPM package name' });
  const versionSchema = z.string({ description: versionDescription });
  return z.object(
    {
      packageName: required ? packageSchema : packageSchema.optional(),
      version: required ? versionSchema : versionSchema.optional(),
    },
    { description: 'NPM package name and version of a published package' },
  ) as ZodObject<{
    packageName: TRequired extends true ? ZodString : ZodOptional<ZodString>;
    version: TRequired extends true ? ZodString : ZodOptional<ZodString>;
  }>;
}

/** Schema for a weight */
export const weightSchema = nonnegativeNumberSchema.describe(
  'Coefficient for the given score (use weight 0 if only for display)',
);

export function weightedRefSchema(
  description: string,
  slugDescription: string,
) {
  return z.object(
    {
      slug: slugSchema.describe(slugDescription),
      weight: weightSchema.describe('Weight used to calculate score'),
    },
    { description },
  );
}

export type WeightedRef = z.infer<ReturnType<typeof weightedRefSchema>>;

export function scorableSchema<T extends ReturnType<typeof weightedRefSchema>>(
  description: string,
  refSchema: T,
  duplicateCheckFn: (metrics: z.infer<T>[]) => false | string[],
  duplicateMessageFn: (metrics: z.infer<T>[]) => string,
) {
  return z.object(
    {
      slug: slugSchema.describe('Human-readable unique ID, e.g. "performance"'),
      refs: z
        .array(refSchema)
        .min(1, { message: 'In a category, there has to be at least one ref' })
        // refs are unique
        .refine(
          refs => !duplicateCheckFn(refs),
          refs => ({
            message: duplicateMessageFn(refs),
          }),
        )
        // category weights are correct
        .refine(hasNonZeroWeightedRef, refs => {
          const affectedRefs = refs.map(ref => ref.slug).join(', ');
          return {
            message: `In a category, there has to be at least one ref with weight > 0. Affected refs: ${affectedRefs}`,
          };
        }),
    },
    { description },
  );
}

export const materialIconSchema = z.enum(MATERIAL_ICONS, {
  description: 'Icon from VSCode Material Icons extension',
});
export type MaterialIcon = z.infer<typeof materialIconSchema>;

type Ref = { weight: number };

function hasNonZeroWeightedRef(refs: Ref[]) {
  return refs.reduce((acc, { weight }) => weight + acc, 0) !== 0;
}
