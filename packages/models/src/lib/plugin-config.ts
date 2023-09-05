import { z } from 'zod';
import {
  descriptionSchema,
  docsUrlSchema,
  generalFilePathSchema,
  slugSchema,
  titleSchema,
  weightSchema,
} from './implementation/schemas';
import {
  hasMissingStrings,
  hasDuplicateStrings,
  errorItems,
} from './implementation/utils';

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
export const groupSchema = z.object(
  {
    slug: slugSchema('Human-readable unique ID .e.g. "performance"'),
    title: titleSchema('Display name'),
    description: descriptionSchema('Description (Markdown)'),
    audits: z
      .array(
        z.object({
          ref: slugSchema(
            "Reference slug to an audit within plugin (e.g. 'max-lines')",
          ),
          weight: weightSchema(
            'Coefficient for the given score (use weight 0 if only for display)',
          ),
        }),
        { description: 'Weighted references to plugin-specific audits' },
      )
      // group refs are unique
      .refine(
        groupAudits => !getDuplicateRefsInGroups(groupAudits),
        groupAudits => ({
          message: duplicateRefsInGroupsErrorMsg(groupAudits),
        }),
      ),
  },
  {
    description:
      'A group aggregates a set of audits into a single score which can be referenced from a category. ' +
      'e.g. the group slug "performance" groups audits and can be referenced in a category as "[plugin-slug]#group:[group-slug]")',
  },
);

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
    audits: z
      .array(auditMetadataSchema, {
        description: 'List of audits maintained in a plugin',
      })
      // audit slugs are unique
      .refine(
        auditMetadata => !getDuplicateSlugsInAudits(auditMetadata),
        auditMetadata => ({
          message: duplicateSlugsInAuditsErrorMsg(auditMetadata),
        }),
      ),
    groups: z
      .array(groupSchema, {
        description: 'List of groups',
      })
      .optional()
      .refine(
        auditMetadata => !getDuplicateSlugsInGroups(auditMetadata),
        auditMetadata => ({
          message: duplicateSlugsInGroupsErrorMsg(auditMetadata),
        }),
      ),
  })
  // every listed group ref points to an audit within the plugin
  .refine(
    pluginCfg => !getMissingRefsFromGroups(pluginCfg),
    pluginCfg => ({
      message: missingRefsFromGroupsErrorMsg(pluginCfg),
    }),
  );

export type PluginConfigSchema = z.infer<typeof pluginConfigSchema>;

// helper for validator: audit slugs are unique
function duplicateSlugsInAuditsErrorMsg(auditMetadata) {
  const duplicateRefs = getDuplicateSlugsInAudits(auditMetadata);
  return `In plugin audits the slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateSlugsInAudits(auditMetadata) {
  return hasDuplicateStrings(auditMetadata.map(({ slug }) => slug));
}

// helper for validator: group refs are unique
function duplicateSlugsInGroupsErrorMsg(groups) {
  const duplicateRefs = getDuplicateSlugsInGroups(groups);
  return `In groups the slugs are not unique: ${errorItems(duplicateRefs)}`;
}
function getDuplicateSlugsInGroups(groups) {
  return hasDuplicateStrings(groups.map(({ slug }) => slug));
}

// helper for validator: group refs are unique
function duplicateRefsInGroupsErrorMsg(groupAudits) {
  const duplicateRefs = getDuplicateRefsInGroups(groupAudits);
  return `In plugin groups the audit refs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateRefsInGroups(groupAudits) {
  return hasDuplicateStrings(groupAudits.map(({ ref }) => ref));
}

// helper for validator: every listed group ref points to an audit within the plugin
function missingRefsFromGroupsErrorMsg(groupCfg) {
  const missingRefs = getMissingRefsFromGroups(groupCfg);
  return `In the groups, the following audit ref's needs to point to a audit in this plugin config: ${errorItems(
    missingRefs,
  )}`;
}

function getMissingRefsFromGroups(pluginCfg) {
  if (pluginCfg?.groups.length && pluginCfg?.audits.length) {
    return hasMissingStrings(
      pluginCfg.groups.flatMap(({ audits }) => audits.map(({ ref }) => ref)),
      pluginCfg.audits.map(({ slug }) => slug),
    );
  }
  return false;
}
