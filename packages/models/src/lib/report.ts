import { z } from 'zod';
import { hasMissingStrings } from './implementation/utils';
import {
  auditGroupSchema,
  AuditOutputs,
  auditOutputSchema,
  auditSchema,
  PluginConfig,
  pluginSchema,
} from './plugin-config';
import {
  executionMetaSchema,
  packageVersionSchema,
} from './implementation/schemas';
import { categoryConfigSchema } from './category-config';

export const auditReportSchema = auditSchema.merge(auditOutputSchema);
export type AuditReport = z.infer<typeof auditReportSchema>;

export const pluginReportSchema = pluginSchema
  .merge(
    executionMetaSchema({
      descriptionDate: 'Start date and time of plugin run',
      descriptionDuration: 'Duration of the plugin run in ms',
    }),
  )
  .merge(
    z.object({
      audits: z.array(auditReportSchema),
      groups: z.array(auditGroupSchema),
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
        categories: z.array(categoryConfigSchema),
        plugins: z.array(pluginReportSchema),
      },
      { description: 'Collect output data' },
    ),
  );

export type Report = z.infer<typeof reportSchema>;

/**
 *
 * Validation function for a plugins audit outputs inside the CLI. Used immediately after generation of the output to validate the result.
 *
 */
export function auditOutputsRefsPresentInPluginConfigs(
  audits: AuditOutputs,
  cfg: PluginConfig,
): string[] | false {
  const outRefs = audits.map(({ slug }) => slug);
  const pluginRef = cfg.audits.map(({ slug }) => cfg.slug + '#' + slug);
  return hasMissingStrings(outRefs, pluginRef);
}
