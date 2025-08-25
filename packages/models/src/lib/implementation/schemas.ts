import { MATERIAL_ICONS } from 'vscode-material-icons';
import {
  ZodError,
  type ZodIssue,
  type ZodObject,
  type ZodOptional,
  type ZodString,
  z,
} from 'zod';
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
    date: z.string().describe(options.descriptionDate),
    duration: z.number().describe(options.descriptionDuration),
  });
}

/** Schema for a slug of a categories, plugins or audits. */
export const slugSchema = z
  .string()
  .regex(slugRegex, {
    message:
      'The slug has to follow the pattern [0-9a-z] followed by multiple optional groups of -[0-9a-z]. e.g. my-slug',
  })
  .max(MAX_SLUG_LENGTH, {
    message: `The slug can be max ${MAX_SLUG_LENGTH} characters long`,
  })
  .describe('Unique ID (human-readable, URL-safe)');

/**  Schema for a general description property */
export const descriptionSchema = z
  .string()
  .max(MAX_DESCRIPTION_LENGTH)
  .describe('Description (markdown)')
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
      ctx.issues.length === 1 &&
      (ctx.issues[0]?.errors as ZodIssue[][])
        .flat()
        .some(
          error => error.code === 'invalid_format' && error.format === 'url',
        )
    ) {
      console.warn(`Ignoring invalid docsUrl: ${ctx.value}`);
      return '';
    }
    throw new ZodError(ctx.error.issues);
  })
  .describe('Documentation site');

/** Schema for a title of a plugin, category and audit */
export const titleSchema = z
  .string()
  .max(MAX_TITLE_LENGTH)
  .describe('Descriptive name');

/** Schema for score of audit, category or group */
export const scoreSchema = z
  .number()
  .min(0)
  .max(1)
  .describe('Value between 0 and 1');

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
  const meta = z.object({
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
  });
  return description ? meta.describe(description) : meta;
}

/** Schema for a generalFilePath */
export const filePathSchema = z
  .string()
  .trim()
  .min(1, { message: 'The path is invalid' });

/**
 * Regex for glob patterns - validates file paths and glob patterns
 * Allows normal paths and paths with glob metacharacters: *, **, {}, [], !, ?
 * Excludes invalid path characters: <>"|
 */
const globRegex = /^!?[^<>"|]+$/;

export const globPathSchema = z
  .string()
  .trim()
  .min(1, { message: 'The glob pattern is invalid' })
  .regex(globRegex, {
    message:
      'The path must be a valid file path or glob pattern (supports *, **, {}, [], !, ?)',
  })
  .describe(
    'Schema for a glob pattern (supports wildcards like *, **, {}, !, etc.)',
  );

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

export function packageVersionSchema<
  TRequired extends boolean = false,
>(options?: { versionDescription?: string; required?: TRequired }) {
  const { versionDescription = 'NPM version of the package', required } =
    options ?? {};
  const packageSchema = z.string().describe('NPM package name');
  const versionSchema = z.string().describe(versionDescription);
  return z
    .object({
      packageName: required ? packageSchema : packageSchema.optional(),
      version: required ? versionSchema : versionSchema.optional(),
    })
    .describe(
      'NPM package name and version of a published package',
    ) as ZodObject<{
    packageName: TRequired extends true ? ZodString : ZodOptional<ZodString>;
    version: TRequired extends true ? ZodString : ZodOptional<ZodString>;
  }>;
}

/** Schema for a binary score threshold */
export const scoreTargetSchema = nonnegativeNumberSchema
  .max(1)
  .describe('Pass/fail score threshold (0-1)')
  .optional();

/** Schema for a weight */
export const weightSchema = nonnegativeNumberSchema.describe(
  'Coefficient for the given score (use weight 0 if only for display)',
);

export function weightedRefSchema(
  description: string,
  slugDescription: string,
) {
  return z
    .object({
      slug: slugSchema.describe(slugDescription),
      weight: weightSchema.describe('Weight used to calculate score'),
    })
    .describe(description);
}

export type WeightedRef = z.infer<ReturnType<typeof weightedRefSchema>>;

export function scorableSchema<T extends ReturnType<typeof weightedRefSchema>>(
  description: string,
  refSchema: T,
  duplicateCheckFn: z.core.CheckFn<z.infer<T>[]>,
) {
  return z
    .object({
      slug: slugSchema.describe('Human-readable unique ID, e.g. "performance"'),
      refs: z
        .array(refSchema)
        .min(1, { message: 'In a category, there has to be at least one ref' })
        // refs are unique
        .check(duplicateCheckFn)
        // category weights are correct
        .refine(hasNonZeroWeightedRef, {
          error: 'A category must have at least 1 ref with weight > 0.',
        }),
    })
    .describe(description);
}

export const materialIconSchema = z
  .enum(MATERIAL_ICONS)
  .describe('Icon from VSCode Material Icons extension');
export type MaterialIcon = z.infer<typeof materialIconSchema>;

type Ref = { weight: number };

function hasNonZeroWeightedRef(refs: Ref[]) {
  return refs.reduce((acc, { weight }) => weight + acc, 0) !== 0;
}

export const filePositionSchema = z
  .object({
    startLine: positiveIntSchema.describe('Start line'),
    startColumn: positiveIntSchema.describe('Start column').optional(),
    endLine: positiveIntSchema.describe('End line').optional(),
    endColumn: positiveIntSchema.describe('End column').optional(),
  })
  .describe('Location in file');
