import {z} from 'zod';
import {PluginConfig, RunnerOutput, runnerOutputSchema} from './plugin-config';
import {hasMissingStrings,} from './implementation/utils';

/**
 * Define Zod schema for the CollectOptions type
 *
 * @example
 *
 * // Example data
 * const raw = {
 *   ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = collectOptions.safeParse(raw);
 *
 * if (validationResult.success) {
 *   console.log('Valid config:', validationResult.data);
 * } else {
 *   console.error('Invalid config:', validationResult.error);
 * }
 *
 */
export const reportSchema = runnerOutputSchema.merge(
  z.object(
    {
      version: z.string({description: 'NPM version of the CLI'}),
      date: z.string({description: 'Start date and time of the collect run'}),
      duration: z.number({description: 'Duration of the collect run in ms'}),
    },
    {
      description:
        'Collect output data. JSON formatted output emitted by the given plugins.',
    },
  ),
);
export type Report = z.infer<
  typeof reportSchema
>;

/**
 *
 * Validation function for a plugin runner output inside the CLI. Used immediately after generation of the output to validate the result.
 *
 */
export function runnerOutputAuditRefsPresentInPluginConfigs(
  out: RunnerOutput,
  cfg: PluginConfig,
): string[] | false {
  const outRefs = out.audits.map(({ slug }) => slug);
  const pluginRef = cfg.audits.map(({ slug }) => cfg.meta.slug + '#' + slug);
  return hasMissingStrings(outRefs, pluginRef);
}
