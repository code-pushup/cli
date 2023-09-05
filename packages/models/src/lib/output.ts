import { z } from 'zod';
import { slugSchema, unixFilePathSchema } from './implementation/schemas';
import { PluginConfigSchema } from './plugins';
import { stringsExist } from './implementation/utils';

/**
 * Define Zod schema for the SourceFileLocation type.
 *
 * @example
 *
 * // Example data for the RunnerOutput type
 * const runnerOutputData = {
 *   audits: [
 *     // ... populate with example audit data ...
 *   ],
 * };
 *
 * // Validate the data against the schema
 * const validationResult = runnerOutputSchema.safeParse(runnerOutputData);
 *
 * if (validationResult.success) {
 *   console.log('Valid runner output:', validationResult.data);
 * } else {
 *   console.error('Invalid runner output:', validationResult.error);
 * }
 */
const sourceFileLocationSchema = z.object(
  {
    file: unixFilePathSchema('Relative path to source file in Git repo'),
    position: z
      .object(
        {
          startLine: z
            .number({ description: 'Start line' })
            .int()
            .nonnegative(),
          startColumn: z
            .number({ description: 'Start column' })
            .int()
            .nonnegative()
            .optional(),
          endLine: z
            .number({ description: 'End line' })
            .int()
            .nonnegative()
            .optional(),
          endColumn: z
            .number({ description: 'End column' })
            .int()
            .nonnegative()
            .optional(),
        },
        { description: 'Location in file' },
      )
      .optional(),
  },
  { description: 'Source file location' },
);

/**
 * Define Zod schema for the Issue type.
 */
const issueSchema = z.object(
  {
    message: z.string({ description: 'Descriptive error message' }).max(128),
    severity: z.enum(['info', 'warning', 'error'], {
      description: 'Severity level',
    }),
    // "Reference to source code"
    source: sourceFileLocationSchema.optional(),
  },
  { description: 'Issue information' },
);

/**
 * Define Zod schema for the Audit type.
 */
const auditSchema = z.object(
  {
    slug: slugSchema('References audit metadata'),
    displayValue: z
      .string({ description: "Formatted value (e.g. '0.9 s', '2.1 MB')" })
      .optional(),
    value: z
      .number({ description: 'Raw numeric value' })
      .int()
      .nonnegative()
      .min(0)
      .optional(),
    score: z
      .number({
        description:
          'Value between 0 and 1 (defaults to Number(details.warnings.length === 0))',
      })
      .min(0)
      .max(1)
      .optional(),
    details: z
      .object(
        {
          issues: z.array(issueSchema, { description: 'List of findings' }),
        },
        { description: 'Detailed information' },
      )
      .optional(),
  },
  { description: 'Audit information' },
);

/**
 * Define Zod schema for the RunnerOutput type.
 */
export const runnerOutputSchema = z.object(
  {
    audits: z.array(auditSchema, { description: 'List of audits' }),
  },
  { description: 'JSON formatted output emitted by the runner.' },
);

export type RunnerOutputSchema = z.infer<typeof runnerOutputSchema>;

/**
 * Define Zod schema for the RunnerOutput type.
 */
export const pluginsOutputSchema = z.object(
  {
    date: z.date({
      description: 'ISO format date of the start of all plugin runs',
    }),
    duration: z.string({ description: 'Duration od all plugin runs in ms' }),
  },
  { description: 'JSON formatted output emitted after executing all plugins.' },
);
export type PluginsOutputSchema = z.infer<typeof pluginsOutputSchema>;

/**
 *
 * Validation function for a plugin runner output inside the CLI. Used immediately after generation of the output to validate the result.
 *
 */
export function runnerOutputAuditRefsPresentInPluginConfigs(
  out: RunnerOutputSchema,
  cfg: PluginConfigSchema,
): true | string[] {
  const outRefs = out.audits.map(({ slug }) => slug);
  const pluginRef = cfg.audits.map(({ slug }) => cfg.meta.slug + '#' + slug);
  return stringsExist(outRefs, pluginRef);
}
