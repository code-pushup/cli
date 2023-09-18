import { z } from 'zod';
import { hasMissingStrings } from './implementation/utils';
import {
  PluginConfig,
  PluginRunnerOutput,
  auditMetadataSchema,
  auditOutputSchema,
  pluginMetadataSchema,
} from './plugin-config';
import { packageVersionSchema } from './implementation/schemas';

export const auditReportSchema = auditMetadataSchema.merge(auditOutputSchema);
export type AuditReport = z.infer<typeof auditReportSchema>;

export const pluginReportSchema = z.object({
  date: z.string({ description: 'Start date and time of plugin run' }),
  duration: z.number({ description: 'Duration of the plugin run in ms' }),
  meta: pluginMetadataSchema,
  audits: z.array(auditReportSchema),
});
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
 * Validation function for a plugin runner output inside the CLI. Used immediately after generation of the output to validate the result.
 *
 */
export function runnerOutputAuditRefsPresentInPluginConfigs(
  out: PluginRunnerOutput,
  cfg: PluginConfig,
): string[] | false {
  const outRefs = out.audits.map(({ slug }) => slug);
  const pluginRef = cfg.audits.map(({ slug }) => cfg.meta.slug + '#' + slug);
  return hasMissingStrings(outRefs, pluginRef);
}
