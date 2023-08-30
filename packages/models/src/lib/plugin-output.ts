import {z} from 'zod';

/**
 * Define Zod schema for the IssueSeverity type.
 */
const issueSeveritySchema = z.enum(['info', 'warning', 'error'], {
  description: 'Severity level',
});

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
    file: z.string({ description: 'Relative path to source file in Git repo' }),
    position: z
      .object(
        {
          startLine: z.number({ description: 'Start line' }),
          startColumn: z.number({ description: 'Start column' }).optional(),
          endLine: z.number({ description: 'End line' }).optional(),
          endColumn: z.number({ description: 'End column' }).optional(),
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
    message: z.string({ description: 'Descriptive error message' }),
    severity: z.enum(['info', 'warning', 'error'], {
      description: 'Severity level',
    }),
    // "Reference to source code"
    source: sourceFileLocationSchema.optional(),
    // TODO: Define other context data here
  },
  { description: 'Issue information' },
);

/**
 * Define Zod schema for the Audit type.
 */
const auditSchema = z.object(
  {
    slug: z.string({ description: 'References audit metadata' }),
    displayValue: z
      .string({ description: "Formatted value (e.g. '0.9 s', '2.1 MB')" })
      .optional(),
    value: z
      .number({
        description:
          'Raw numeric value (defaults to score ?? details.warnings.length)',
      })
      .optional(),
    score: z
      .number({
        description:
          'Value between 0 and 1 (defaults to Number(details.warnings.length === 0))',
      })
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
