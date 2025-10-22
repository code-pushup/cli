import { z } from 'zod';
import { auditOutputSchema } from './audit-output.js';
import { auditSchema } from './audit.js';
import { categoryConfigSchema } from './category-config.js';
import { commitSchema } from './commit.js';
import { groupSchema } from './group.js';
import { createCheck } from './implementation/checks.js';
import {
  executionMetaSchema,
  packageVersionSchema,
} from './implementation/schemas.js';
import { findMissingSlugsInCategoryRefs } from './implementation/utils.js';
import {
  findMissingSlugsInGroupRefs,
  pluginMetaSchema,
} from './plugin-config.js';

export const auditReportSchema = auditSchema.merge(auditOutputSchema);
export type AuditReport = z.infer<typeof auditReportSchema>;

export const pluginReportSchema = pluginMetaSchema
  .merge(
    executionMetaSchema({
      descriptionDate: 'Start date and time of plugin run',
      descriptionDuration: 'Duration of the plugin run in ms',
    }),
  )
  .merge(
    z.object({
      audits: z.array(auditReportSchema).min(1),
      groups: z.array(groupSchema).optional(),
    }),
  )
  .check(createCheck(findMissingSlugsInGroupRefs));

export type PluginReport = z.infer<typeof pluginReportSchema>;

export const reportSchema = packageVersionSchema({
  versionDescription: 'NPM version of the CLI',
  required: true,
})
  .merge(
    executionMetaSchema({
      descriptionDate: 'Start date and time of the collect run',
      descriptionDuration: 'Duration of the collect run in ms',
    }),
  )
  .merge(
    z.object({
      plugins: z.array(pluginReportSchema).min(1),
      categories: z.array(categoryConfigSchema).optional(),
      commit: commitSchema
        .meta({ description: 'Git commit for which report was collected' })
        .nullable(),
      label: z
        .string()
        .optional()
        .meta({ description: 'Label (e.g. project name)' }),
    }),
  )
  .check(createCheck(findMissingSlugsInCategoryRefs))
  .meta({ description: 'Collect output data' });

export type Report = z.infer<typeof reportSchema>;
