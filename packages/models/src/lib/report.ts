import { z } from 'zod';
import {
  errorItems,
  hasDuplicateStrings,
  hasMissingStrings,
} from './implementation/utils';
import {
  AuditMetadata,
  auditMetadataSchema,
  PluginConfig,
  pluginMetadataSchema,
} from './plugin-config';
import {
  positiveIntSchema,
  slugSchema,
  unixFilePathSchema,
} from './implementation/schemas';

export type PluginOutput = RunnerOutput & {
  slug: string;
  date: string;
  duration: number;
};

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
          startLine: positiveIntSchema('Start line'),
          startColumn: positiveIntSchema('Start column').optional(),
          endLine: positiveIntSchema('End line').optional(),
          endColumn: positiveIntSchema('End column').optional(),
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
export const issueSchema = z.object(
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
export type Issue = z.infer<typeof issueSchema>;
/**
 * Define Zod schema for the Audit type.
 */
export const auditResultSchema = z.object(
  {
    slug: slugSchema('References audit metadata'),
    displayValue: z
      .string({ description: "Formatted value (e.g. '0.9 s', '2.1 MB')" })
      .optional(),
    value: positiveIntSchema('Raw numeric value'),
    score: z
      .number({
        description: 'Value between 0 and 1',
      })
      .min(0)
      .max(1),
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
    audits: z
      .array(auditResultSchema, { description: 'List of audits' })
      // audit slugs are unique
      .refine(
        audits => !getDuplicateSlugsInAudits(audits as never), //@TODO use hackfix types instead of never same as in plugin config
        audits => ({
          message: duplicateSlugsInAuditsErrorMsg(audits as never),
        }),
      ),
  },
  { description: 'JSON formatted output emitted by the runner.' },
);
export type RunnerOutput = z.infer<typeof runnerOutputSchema>;

export const auditReportSchema = auditResultSchema.merge(auditMetadataSchema);
export type AuditReport = z.infer<typeof auditReportSchema>;

export const pluginReportSchema = z.object({
  date: z.string({ description: 'Start date and time of plugin run' }),
  duration: z.number({ description: 'Duration of the plugin run in ms' }),
  meta: pluginMetadataSchema,
  audits: z.array(auditReportSchema),
});
export type PluginReport = z.infer<typeof pluginReportSchema>;

export const reportSchema = z.object(
  {
    package: z.string({ description: 'NPM package name' }),
    version: z.string({ description: 'NPM version of the CLI' }),
    date: z.string({ description: 'Start date and time of the collect run' }),
    duration: z.number({ description: 'Duration of the collect run in ms' }),
    plugins: z.array(pluginReportSchema),
  },
  { description: 'Collect output data.' },
);

export type Report = z.infer<typeof reportSchema>;

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

// helper for validator: audit slugs are unique in report
function duplicateSlugsInAuditsErrorMsg(audits: AuditMetadata[]) {
  const duplicateRefs = getDuplicateSlugsInAudits(audits);
  return `In the report audits the slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateSlugsInAudits(audits: AuditMetadata[]) {
  return hasDuplicateStrings(audits.map(({ slug }) => slug));
}
