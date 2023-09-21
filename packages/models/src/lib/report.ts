import { z } from 'zod';
import { hasMissingStrings } from './implementation/utils';
import {
  PluginConfig,
  AuditOutputs,
  auditSchema,
  auditOutputSchema,
} from './plugin-config';
import {
  executionMetaSchema,
  metaSchema,
  packageVersionSchema,
  slugSchema,
} from './implementation/schemas';

export const auditReportSchema = auditSchema.merge(auditOutputSchema);
export type AuditReport = z.infer<typeof auditReportSchema>;

export const pluginReportSchema = executionMetaSchema({
  descriptionDate: 'Start date and time of plugin run',
  descriptionDuration: 'Duration of the plugin run in ms',
})
  .merge(metaSchema())
  .merge(
    z.object({
      slug: slugSchema(),
      icon: z.string().optional(),
      audits: z.array(auditReportSchema),
    }),
  );
export type PluginReport = z.infer<typeof pluginReportSchema>;

export const reportSchema = packageVersionSchema({
  versionDescription: 'NPM version of the CLI',
}).merge(
  z.object(
    {
      date: z.string({ description: 'Start date and time of the collect run' }),
      duration: z.number({ description: 'Duration of the collect run in ms' }),
      plugins: z.array(pluginReportSchema),
    },
    { description: 'Collect output data.' },
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
