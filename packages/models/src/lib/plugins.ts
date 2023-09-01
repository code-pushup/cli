import { z } from 'zod';
import { slugRegex } from './implementation/utils';

// Define Zod schema for the PluginMetadata type
const pluginMetadataSchema = z.object(
  {
    slug: z
      .string({
        description: 'Unique ID (human-readable, URL-safe)',
      })
      .regex(slugRegex),
    name: z.string({
      description: 'Display name',
    }),
    type: z.enum(
      [
        'static-analysis',
        'performance-measurements',
        'test-coverage',
        'dependency-audit',
      ],
      { description: 'Plugin categorization' },
    ),
    icon: z.union([z.unknown(), z.string()], {
      description: 'Icon from VSCode Material Icons extension',
    }),
    docsUrl: z.string({ description: 'Plugin documentation site' }).optional(),
  },
  {
    description: 'Plugin metadata',
  },
);

// Define Zod schema for the RunnerConfig type
const runnerConfigSchema = z.object(
  {
    command: z.string({
      description: 'Shell command to execute',
    }),
    args: z.array(z.string({ description: 'Command arguments' })).optional(),
    outputPath: z.string({
      description: 'Output path',
    }),
  },
  {
    description: 'How to execute runner',
  },
);

// Define Zod schema for the AuditMetadata type
const auditMetadataSchema = z.object(
  {
    slug: z
      .string({
        description: 'ID (unique within plugin)',
      })
      .regex(slugRegex),
    label: z.string({
      description: 'Abbreviated name',
    }),
    title: z.string({
      description: 'Descriptive name',
    }),
    description: z.string({ description: 'Description (Markdown)' }).optional(),
    docsUrl: z
      .string({ description: 'Link to documentation (rationale)' })
      .optional(),
  },
  { description: 'List of scorable metrics for the given plugin' },
);

// Define Zod schema for the Group type
const groupSchema = z.object({
  slug: z
    .string({
      description: 'Human-readable unique ID',
    })
    .regex(slugRegex),
  title: z.string({
    description: 'Display name',
  }),
  description: z.string({ description: 'Description (Markdown)' }).optional(),
  audits: z.array(
    z.object({
      ref: z.string({
        description: "Reference to an audit within plugin (e.g. 'max-lines')",
      }),
      weight: z.number({
        description:
          'Coefficient for the given score (use weight 0 if only for display)',
      }),
    }),
    { description: 'Weighted references to plugin-specific audits' },
  ),
});

/**
 * Define Zod schema for the PluginConfig type
 *
 * @example
 *
 * // Example data for the PluginConfig type
 * const pluginConfigData = {
 *   // ... populate with example data ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = pluginConfigSchema.safeParse(pluginConfigData);
 *
 * if (validationResult.success) {
 *   console.log('Valid plugin config:', validationResult.data);
 * } else {
 *   console.error('Invalid plugin config:', validationResult.error);
 * }
 */
export const pluginConfigSchema = z.object({
  meta: pluginMetadataSchema,
  runner: runnerConfigSchema,
  audits: z.array(auditMetadataSchema),
  groups: z.array(groupSchema, { description: 'List of groups' }).optional(),
});

export type PluginConfigSchema = z.infer<typeof pluginConfigSchema>;
