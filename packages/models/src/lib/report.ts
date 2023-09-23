import { z } from 'zod';
import {
  duplicateSlugsInAuditsErrorMsg,
  getDuplicateSlugsInAudits,
  hasMissingStrings,
} from './implementation/utils';
import {
  Audit,
  auditSchema,
  PluginConfig,
  pluginSchema,
} from './plugin-config';
import {
  executionMetaSchema,
  packageVersionSchema,
  positiveIntSchema,
  scoreSchema,
  unixFilePathSchema,
} from './implementation/schemas';
import { categoryConfigSchema } from './category-config';

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

export const issueSchema = z.object(
  {
    message: z.string({ description: 'Descriptive error message' }).max(128),
    severity: z.enum(['info', 'warning', 'error'], {
      description: 'Severity level',
    }),
    source: sourceFileLocationSchema.optional(),
  },
  { description: 'Issue information' },
);
export type Issue = z.infer<typeof issueSchema>;

export const auditOutputSchema = auditSchema.merge(
  z.object(
    {
      displayValue: z
        .string({ description: "Formatted value (e.g. '0.9 s', '2.1 MB')" })
        .optional(),
      value: positiveIntSchema('Raw numeric value').optional(),
      score: scoreSchema().optional(),
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
  ),
);
export type AuditOutput = z.infer<typeof auditOutputSchema>;

export const pluginOutputSchema = pluginSchema
  .merge(executionMetaSchema()) // @TODO create reusable meta info for audit, plugin, category
  .merge(
    z.object(
      {
        audits: z
          .array(auditOutputSchema, {
            description:
              'List of JSON formatted audit output emitted by the runner process of a plugin',
          })
          // audit slugs are unique
          .refine(
            audits => !getDuplicateSlugsInAudits(audits),
            audits => ({ message: duplicateSlugsInAuditsErrorMsg(audits) }),
          ),
      },
      {
        description:
          'List of JSON formatted audit output emitted by the runner process of a plugin',
      },
    ),
  );
export type PluginOutput = z.infer<typeof pluginOutputSchema>;

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
  audits: Audit[],
  cfg: PluginConfig,
): string[] | false {
  const outRefs = audits.map(({ slug }) => slug);
  const pluginRef = cfg.audits.map(({ slug }) => cfg.slug + '#' + slug);
  return hasMissingStrings(outRefs, pluginRef);
}
