import { z } from 'zod';
import {
  descriptionSchema,
  docsUrlSchema,
  generalFilePathSchema,
  positiveIntSchema,
  slugSchema,
  titleSchema,
  unixFilePathSchema,
  weightSchema,
} from './implementation/schemas';
import {
  hasMissingStrings,
  hasDuplicateStrings,
  errorItems,
  exists,
} from './implementation/utils';

// Define Zod schema for the PluginMetadata type
const pluginMetadataSchema = z.object(
  {
    slug: slugSchema(),
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
export const auditMetadataSchema = z.object(
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

export type AuditMetadata = z.infer<typeof auditMetadataSchema>;
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
          weight: weightSchema(),
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

export type Group = z.infer<typeof groupSchema>;

/**
 * Define Zod schema for the PluginConfig type
 *
 * @example
 *
 * // Example data for the PluginConfig type
 * const data = {
 *   // ...
 * };
 *
 * // Validate the data against the schema
 * const validationResult = pluginConfigSchema.safeParse(data);
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
        groups => !getDuplicateSlugsInGroups(groups),
        groups => ({
          message: duplicateSlugsInGroupsErrorMsg(groups),
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

export type PluginConfig = z.infer<typeof pluginConfigSchema>;

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
export type Issue = z.infer<typeof issueSchema>
/**
 * Define Zod schema for the Audit type.
 */
const auditSchema = z.object(
  {
    slug: slugSchema('References audit metadata'),
    displayValue: z
      .string({ description: "Formatted value (e.g. '0.9 s', '2.1 MB')" })
      .optional(),
    value: positiveIntSchema('Raw numeric value').optional(),
    score: z
      .number({
        description: 'Value between 0 and 1',
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

type Audit = z.infer<typeof auditSchema>;

/**
 * Define Zod schema for the RunnerOutput type.
 */
export const runnerOutputSchema = z.object(
  {
    audits: z
      .array(auditSchema, { description: 'List of audits' })
      // audit slugs are unique
      .refine(
        audits => !getDuplicateSlugsInAudits(audits),
        audits => ({ message: duplicateSlugsInAuditsErrorMsg(audits) }),
      ),
  },
  { description: 'JSON formatted output emitted by the runner.' },
);
export type RunnerOutput = z.infer<typeof runnerOutputSchema>;

// helper for validator: audit slugs are unique
function duplicateSlugsInAuditsErrorMsg(audits: Audit[]) {
  const duplicateRefs = getDuplicateSlugsInAudits(audits);
  return `In plugin audits the slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateSlugsInAudits(audits: Audit[]) {
  return hasDuplicateStrings(audits.map(({ slug }) => slug));
}

// helper for validator: group refs are unique
function duplicateSlugsInGroupsErrorMsg(groups: Group[] | undefined) {
  const duplicateRefs = getDuplicateSlugsInGroups(groups);
  return `In groups the slugs are not unique: ${errorItems(duplicateRefs)}`;
}
function getDuplicateSlugsInGroups(groups: Group[] | undefined) {
  return Array.isArray(groups)
    ? hasDuplicateStrings(groups.map(({ slug }) => slug))
    : false;
}

type RefsList = { ref?: string }[];
// helper for validator: group refs are unique
function duplicateRefsInGroupsErrorMsg(groupAudits: RefsList) {
  const duplicateRefs = getDuplicateRefsInGroups(groupAudits);
  return `In plugin groups the audit refs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateRefsInGroups(groupAudits: RefsList) {
  return hasDuplicateStrings(groupAudits.map(({ ref }) => ref).filter(exists));
}
type PluginCfg = {
  audits?: AuditMetadata[];
  groups?: Group[];
};

// helper for validator: every listed group ref points to an audit within the plugin
function missingRefsFromGroupsErrorMsg(pluginCfg: PluginCfg) {
  const missingRefs = getMissingRefsFromGroups(pluginCfg);
  return `In the groups, the following audit ref's needs to point to a audit in this plugin config: ${errorItems(
    missingRefs,
  )}`;
}

function getMissingRefsFromGroups(pluginCfg: PluginCfg) {
  if (pluginCfg?.groups?.length && pluginCfg?.audits?.length) {
    const groups = pluginCfg?.groups || [];
    const audits = pluginCfg?.audits || [];
    return hasMissingStrings(
      groups.flatMap(({ audits }) => audits.map(({ ref }) => ref)),
      audits.map(({ slug }) => slug),
    );
  }
  return false;
}
