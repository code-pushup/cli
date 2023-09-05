import { z } from 'zod';
import {
  descriptionSchema,
  docsUrlSchema,
  generalFilePathSchema,
  slugSchema,
  titleSchema,
} from './implementation/schemas';
import { stringsExist, stringsUnique } from './implementation/utils';

// Define Zod schema for the PluginMetadata type
const pluginMetadataSchema = z.object(
  {
    slug: slugSchema('Unique ID (human-readable, URL-safe)'),
    name: z
      .string({
        description: 'Display name',
      })
      .max(128),
    icon: z.union([z.unknown(), z.string()], {
      description: 'Icon from VSCode Material Icons extension',
    }),
    docsUrl: docsUrlSchema('Plugin documentation site'),
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
    outputPath: generalFilePathSchema('Output path'),
  },
  {
    description: 'How to execute runner',
  },
);

// Define Zod schema for the AuditMetadata type
const auditMetadataSchema = z.object(
  {
    slug: slugSchema('ID (unique within plugin)'),
    label: z
      .string({
        description: 'Abbreviated name',
      })
      .max(128),
    title: titleSchema('Descriptive name'),
    description: descriptionSchema('Description (Markdown)'),
    docsUrl: docsUrlSchema('Link to documentation (rationale)'),
  },
  { description: 'List of scorable metrics for the given plugin' },
);

// Define Zod schema for the `Group` type
const groupSchema = z.object({
  slug: slugSchema('Human-readable unique ID .e.g. "performance"'),
  title: titleSchema('Display name'),
  description: descriptionSchema('Description (Markdown)'),
  audits: z
    .array(
      z.object({
        ref: slugSchema(
          "Reference slug to an audit within plugin (e.g. 'max-lines')",
        ),
        weight: z
          .number({
            description:
              'Coefficient for the given score (use weight 0 if only for display)',
          })
          .int()
          .nonnegative(),
      }),
      { description: 'Weighted references to plugin-specific audits' },
    )
    .refine(
      items => stringsUnique(items.map(i => i.ref)),
      items => {
        const refs = stringsUnique(items.map(i => i.ref));
        const stringsRefs = refs !== true ? refs.join(', ') : '';
        return {
          message: `In plugin audit's the slug are not unique: ${stringsRefs}`,
        };
      },
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
export const pluginConfigSchema = z
  .object({
    meta: pluginMetadataSchema,
    runner: runnerConfigSchema,
    audits: z.array(auditMetadataSchema),
    groups: z.array(groupSchema, { description: 'List of groups' }).optional(),
  })
  .refine(
    pluginCfg =>
      !!stringsExist(
        pluginCfg.groups.flatMap(({ audits }) => audits.map(({ ref }) => ref)),
        pluginCfg.audits.map(({ slug }) => slug),
      ),
    pluginCfg => {
      const notExistingStrings = stringsExist(
        pluginCfg.groups.flatMap(({ audits }) => audits.map(({ ref }) => ref)),
        pluginCfg.audits.map(({ slug }) => slug),
      );
      const nonExistingRefs =
        notExistingStrings !== true ? notExistingStrings.join(', ') : '';
      return {
        message: `In the groups, the following audit ref's needs to point to a audit in this plugin config: ${nonExistingRefs}`,
      };
    },
  );

export type PluginConfigSchema = z.infer<typeof pluginConfigSchema>;
