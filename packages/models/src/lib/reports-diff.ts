import { type ZodTypeAny, z } from 'zod';
import {
  auditDisplayValueSchema,
  auditOutputSchema,
  auditValueSchema,
} from './audit-output';
import { commitSchema } from './commit';
import {
  executionMetaSchema,
  packageVersionSchema,
  scoreSchema,
  slugSchema,
  titleSchema,
} from './implementation/schemas';
import { pluginMetaSchema } from './plugin-config';

function makeComparisonSchema<T extends ZodTypeAny>(schema: T) {
  const sharedDescription = schema.description || 'Result';
  return z.object({
    before: schema.describe(`${sharedDescription} (previous commit)`),
    after: schema.describe(`${sharedDescription} (current commit)`),
  });
}

const scorableMetaSchema = z.object({ slug: slugSchema, title: titleSchema });
const scorableWithPluginMetaSchema = scorableMetaSchema.merge(
  z.object({
    plugin: pluginMetaSchema
      .pick({ slug: true, title: true })
      .describe('Plugin which defines it'),
  }),
);

const scorableDiffSchema = scorableMetaSchema.merge(
  z.object({
    scores: makeComparisonSchema(scoreSchema)
      .merge(
        z.object({
          diff: z
            .number()
            .min(-1)
            .max(1)
            .describe('Score change (`scores.after - scores.before`)'),
        }),
      )
      .describe('Score comparison'),
  }),
);
const scorableWithPluginDiffSchema = scorableDiffSchema.merge(
  scorableWithPluginMetaSchema,
);

export const categoryDiffSchema = scorableDiffSchema;
export const groupDiffSchema = scorableWithPluginDiffSchema;
export const auditDiffSchema = scorableWithPluginDiffSchema.merge(
  z.object({
    values: makeComparisonSchema(auditValueSchema)
      .merge(
        z.object({
          diff: z
            .number()
            .int()
            .describe('Value change (`values.after - values.before`)'),
        }),
      )
      .describe('Audit `value` comparison'),
    displayValues: makeComparisonSchema(auditDisplayValueSchema).describe(
      'Audit `displayValue` comparison',
    ),
  }),
);

export const categoryResultSchema = scorableMetaSchema.merge(
  z.object({ score: scoreSchema }),
);
export const groupResultSchema = scorableWithPluginMetaSchema.merge(
  z.object({ score: scoreSchema }),
);
export const auditResultSchema = scorableWithPluginMetaSchema.merge(
  auditOutputSchema.pick({ score: true, value: true, displayValue: true }),
);

export type CategoryDiff = z.infer<typeof categoryDiffSchema>;
export type GroupDiff = z.infer<typeof groupDiffSchema>;
export type AuditDiff = z.infer<typeof auditDiffSchema>;
export type CategoryResult = z.infer<typeof categoryResultSchema>;
export type GroupResult = z.infer<typeof groupResultSchema>;
export type AuditResult = z.infer<typeof auditResultSchema>;

export const reportsDiffSchema = z
  .object({
    commits: makeComparisonSchema(commitSchema)
      .nullable()
      .describe('Commits identifying compared reports'),
    categories: z
      .object({
        changed: z.array(categoryDiffSchema),
        unchanged: z.array(categoryResultSchema),
        added: z.array(categoryResultSchema),
        removed: z.array(categoryResultSchema),
      })
      .describe('Changes affecting categories'),
    groups: z
      .object({
        changed: z.array(groupDiffSchema),
        unchanged: z.array(groupResultSchema),
        added: z.array(groupResultSchema),
        removed: z.array(groupResultSchema),
      })
      .describe('Changes affecting groups'),
    audits: z
      .object({
        changed: z.array(auditDiffSchema),
        unchanged: z.array(auditResultSchema),
        added: z.array(auditResultSchema),
        removed: z.array(auditResultSchema),
      })
      .describe('Changes affecting audits'),
  })
  .merge(
    packageVersionSchema({
      versionDescription: 'NPM version of the CLI',
      required: true,
    }),
  )
  .merge(
    executionMetaSchema({
      descriptionDate: 'Start date and time of the compare run',
      descriptionDuration: 'Duration of the compare run in ms',
    }),
  );

export type ReportsDiff = z.infer<typeof reportsDiffSchema>;
