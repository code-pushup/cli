import {
  unrefinedCoreConfigSchema,
  CoreConfigSchema,
  globalCliArgsSchema,
  GlobalCliArgsSchema,
  refineCoreConfig,
  runnerOutputSchema,
} from '@quality-metrics/models';
import { executePlugins } from './implementation/execute-plugin';
import { z } from 'zod';

/**
 * Define Zod schema for the RunAndCollectOptions type
 *
 * @example
 *
 * // Example data
 * const raw = {
 *   ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = runAndCollectOptions.safeParse(raw);
 *
 * if (validationResult.success) {
 *   console.log('Valid config:', validationResult.data);
 * } else {
 *   console.error('Invalid config:', validationResult.error);
 * }
 *
 */
export const runAndCollectOptions = refineCoreConfig(
  z
    .object({
      parallel: z
        .preprocess(
          a => parseInt(z.string().parse(a.toString()), 10),
          z.number().positive(),
        )
        .optional()
        .default(1),
    })
    .merge(globalCliArgsSchema)
    .merge(unrefinedCoreConfigSchema),
);

export type RunAndCollectOptions = z.infer<typeof runAndCollectOptions> &
  GlobalCliArgsSchema &
  CoreConfigSchema;

/**
 * Define Zod schema for the RunAndCollectOutputSchema type
 *
 * @example
 *
 * // Example data
 * const raw = {
 *   ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = runAndCollectOutputSchema.safeParse(raw);
 *
 * if (validationResult.success) {
 *   console.log('Valid config:', validationResult.data);
 * } else {
 *   console.error('Invalid config:', validationResult.error);
 * }
 *
 */
export const runAndCollectOutputSchema = runnerOutputSchema.merge(
  z.object(
    {
      date: z.string({ description: 'Date of the run' }),
      duration: z.number({ description: 'Duration of the run in ms' }),
    },
    {
      description:
        'CPU output data. JSON formatted output emitted by cpu CLI collect process.',
    },
  ),
);
export type RunAndCollectOutputSchema = z.infer<
  typeof runAndCollectOutputSchema
>;

/**
 * Run audits and collect files
 * @param options
 */
export async function runAndCollect(
  options: RunAndCollectOptions,
): Promise<RunAndCollectOutputSchema> {
  const { plugins } = options;
  if (plugins?.length) {
    performance.mark('startExecutePlugins');
    const runnerOutputs = await executePlugins(plugins);
    performance.mark('stopExecutePlugins');
    // @TODO better error message e.g. `Plugin ${cfg.slug} produced wrong output under ${processOutputPath}.` + zod trace
    const processResult = runAndCollectOutputSchema.parse({
      ...runnerOutputs,
      date: new Date().toISOString(),
      duration: performance.measure('startExecutePlugins', 'stopExecutePlugins')
        .duration,
    });
    return processResult;
  } else {
    throw new Error('No plugins registered');
  }
}
