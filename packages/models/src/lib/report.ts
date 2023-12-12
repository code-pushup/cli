import { z } from 'zod';
import { categoryConfigSchema } from './category-config';
import {
  executionMetaSchema,
  packageVersionSchema,
} from './implementation/schemas';
import { pluginMetaSchema } from './plugin-config';
import { auditSchema } from './plugin-config-audits';
import { auditGroupSchema } from './plugin-config-groups';
import { auditOutputSchema } from './plugin-process-output';

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
      audits: z.array(auditReportSchema),
      groups: z.array(auditGroupSchema).optional(),
    }),
  );
export type PluginReport = z.infer<typeof pluginReportSchema>;

export const reportSchema = packageVersionSchema({
  versionDescription: 'NPM version of the CLI',
})
  .merge(
    executionMetaSchema({
      descriptionDate: 'Start date and time of the collect run',
      descriptionDuration: 'Duration of the collect run in ms',
    }),
  )
  .merge(
    z.object(
      {
        commit: z.string().optional(),
        categories: z.array(categoryConfigSchema),
        plugins: z.array(pluginReportSchema),
      },
      { description: 'Collect output data' },
    ),
  );

export type Report = z.infer<typeof reportSchema>;
