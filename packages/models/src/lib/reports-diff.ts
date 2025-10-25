import { type ZodTypeAny, z } from 'zod';
import {
  auditDisplayValueSchema,
  auditOutputSchema,
  auditValueSchema,
} from './audit-output.js';
import { commitSchema } from './commit.js';
import {
  docsUrlSchema,
  executionMetaSchema,
  packageVersionSchema,
  scoreSchema,
  slugSchema,
  titleSchema,
  urlSchema,
} from './implementation/schemas.js';
import { pluginMetaSchema } from './plugin-config.js';

function makeComparisonSchema<T extends ZodTypeAny>(schema: T) {
  const sharedDescription = schema.description || 'Result';
  return z.object({
    before: schema.meta({
      description: `${sharedDescription} (source commit)`,
    }),
    after: schema.meta({ description: `${sharedDescription} (target commit)` }),
  });
}

function makeArraysComparisonSchema<
  TDiff extends typeof scorableDiffSchema,
  TResult extends ZodTypeAny,
>(diffSchema: TDiff, resultSchema: TResult, description: string) {
  return z
    .object({
      changed: z.array(diffSchema),
      unchanged: z.array(resultSchema),
      added: z.array(resultSchema),
      removed: z.array(resultSchema),
    })
    .describe(description);
}

const scorableMetaSchema = z.object({
  slug: slugSchema,
  title: titleSchema,
  docsUrl: docsUrlSchema,
});
const scorableWithPluginMetaSchema = scorableMetaSchema.merge(
  z.object({
    plugin: pluginMetaSchema
      .pick({ slug: true, title: true, docsUrl: true })
      .meta({ description: 'Plugin which defines it' }),
  }),
);

const scorableDiffSchema = scorableMetaSchema.merge(
  z.object({
    scores: makeComparisonSchema(scoreSchema)
      .merge(
        z.object({
          diff: z.number().min(-1).max(1).meta({
            description: 'Score change (`scores.after - scores.before`)',
          }),
        }),
      )
      .meta({ description: 'Score comparison' }),
  }),
);
const scorableWithPluginDiffSchema = scorableDiffSchema.merge(
  scorableWithPluginMetaSchema,
);

export const categoryDiffSchema = scorableDiffSchema.meta({
  title: 'CategoryDiff',
});
export const groupDiffSchema = scorableWithPluginDiffSchema.meta({
  title: 'GroupDiff',
});
export const auditDiffSchema = scorableWithPluginDiffSchema
  .merge(
    z.object({
      values: makeComparisonSchema(auditValueSchema)
        .merge(
          z.object({
            diff: z.number().meta({
              description: 'Value change (`values.after - values.before`)',
            }),
          }),
        )
        .meta({ description: 'Audit `value` comparison' }),
      displayValues: makeComparisonSchema(auditDisplayValueSchema).meta({
        description: 'Audit `displayValue` comparison',
      }),
    }),
  )
  .meta({ title: 'AuditDiff' });

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
      .meta({ description: 'Commits identifying compared reports' }),
    portalUrl: urlSchema
      .optional()
      .meta({ description: 'Link to comparison page in Code PushUp portal' }),
    label: z
      .string()
      .optional()
      .meta({ description: 'Label (e.g. project name)' }),
    categories: makeArraysComparisonSchema(
      categoryDiffSchema,
      categoryResultSchema,
      'Changes affecting categories',
    ),
    groups: makeArraysComparisonSchema(
      groupDiffSchema,
      groupResultSchema,
      'Changes affecting groups',
    ),
    audits: makeArraysComparisonSchema(
      auditDiffSchema,
      auditResultSchema,
      'Changes affecting audits',
    ),
  })
  .merge(
    packageVersionSchema({
      versionDescription: 'NPM version of the CLI (when `compare` was run)',
      required: true,
    }),
  )
  .merge(
    executionMetaSchema({
      descriptionDate: 'Start date and time of the compare run',
      descriptionDuration: 'Duration of the compare run in ms',
    }),
  )
  .meta({ title: 'ReportsDiff' });

export type ReportsDiff = z.infer<typeof reportsDiffSchema>;
