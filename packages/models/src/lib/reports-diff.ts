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
  return z.object({
    before: schema,
    after: schema,
  });
}

const scorableMetaSchema = z.object({ slug: slugSchema, title: titleSchema });
const scorableWithPluginMetaSchema = scorableMetaSchema.merge(
  z.object({
    plugin: pluginMetaSchema.pick({ slug: true, title: true }),
  }),
);

const scorableDiffSchema = scorableMetaSchema.merge(
  z.object({
    scores: makeComparisonSchema(scoreSchema).merge(
      z.object({ diff: z.number().min(-1).max(1) }),
    ),
  }),
);
const scorableWithPluginDiffSchema = scorableDiffSchema.merge(
  scorableWithPluginMetaSchema,
);

const categoryDiffSchema = scorableDiffSchema;
const groupDiffSchema = scorableWithPluginDiffSchema;
const auditDiffSchema = scorableWithPluginDiffSchema.merge(
  z.object({
    values: makeComparisonSchema(auditValueSchema).merge(
      z.object({ diff: z.number().int() }),
    ),
    displayValues: makeComparisonSchema(auditDisplayValueSchema),
  }),
);

const categoryResultSchema = scorableMetaSchema.merge(
  z.object({ score: scoreSchema }),
);
const groupResultSchema = scorableWithPluginMetaSchema.merge(
  z.object({ score: scoreSchema }),
);
const auditResultSchema = scorableWithPluginMetaSchema.merge(
  auditOutputSchema.pick({ score: true, value: true, displayValue: true }),
);

export const reportsDiffSchema = z
  .object({
    commits: makeComparisonSchema(commitSchema).nullable(),
    categories: z.object({
      changed: z.array(categoryDiffSchema),
      unchanged: z.array(categoryResultSchema),
      added: z.array(categoryResultSchema),
      removed: z.array(categoryResultSchema),
    }),
    groups: z.object({
      changed: z.array(groupDiffSchema),
      unchanged: z.array(groupResultSchema),
      added: z.array(groupResultSchema),
      removed: z.array(groupResultSchema),
    }),
    audits: z.object({
      changed: z.array(auditDiffSchema),
      unchanged: z.array(auditResultSchema),
      added: z.array(auditResultSchema),
      removed: z.array(auditResultSchema),
    }),
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
