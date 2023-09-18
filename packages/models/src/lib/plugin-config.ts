import { z } from 'zod';
import {
  descriptionSchema,
  docsUrlSchema,
  generalFilePathSchema,
  packageVersionSchema,
  positiveIntSchema,
  scorableSchema,
  slugSchema,
  titleSchema,
  unixFilePathSchema,
  weightedRefSchema,
} from './implementation/schemas';
import {
  errorItems,
  exists,
  hasDuplicateStrings,
  hasMissingStrings,
} from './implementation/utils';

export const pluginMetadataSchema = packageVersionSchema({
  optional: true,
}).merge(
  z.object(
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
  ),
);

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

export const auditMetadataSchema = z.object(
  {
    slug: slugSchema('ID (unique within plugin)'),
    title: titleSchema('Descriptive name'),
    description: descriptionSchema('Description (markdown)'),
    docsUrl: docsUrlSchema('Link to documentation (rationale)'),
  },
  { description: 'List of scorable metrics for the given plugin' },
);

export type AuditMetadata = z.infer<typeof auditMetadataSchema>;

export const auditGroupSchema = scorableSchema(
  'An audit group aggregates a set of audits into a single score which can be referenced from a category. ' +
    'E.g. the group slug "performance" groups audits and can be referenced in a category as "[plugin-slug]#group:[group-slug]")',
  weightedRefSchema(
    'Weighted references to audits',
    "Reference slug to an audit within this plugin (e.g. 'max-lines')",
  ),
  getDuplicateRefsInGroups,
  duplicateRefsInGroupsErrorMsg,
);
export type AuditGroup = z.infer<typeof auditGroupSchema>;

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
      .array(auditGroupSchema, {
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

// helper for validator: group refs are unique
function duplicateSlugsInGroupsErrorMsg(groups: AuditGroup[] | undefined) {
  const duplicateRefs = getDuplicateSlugsInGroups(groups);
  return `In groups the slugs are not unique: ${errorItems(duplicateRefs)}`;
}
function getDuplicateSlugsInGroups(groups: AuditGroup[] | undefined) {
  return Array.isArray(groups)
    ? hasDuplicateStrings(groups.map(({ slug }) => slug))
    : false;
}

type _PluginCfg = {
  audits?: AuditMetadata[];
  groups?: AuditGroup[];
};
// helper for validator: every listed group ref points to an audit within the plugin
function missingRefsFromGroupsErrorMsg(pluginCfg: _PluginCfg) {
  const missingRefs = getMissingRefsFromGroups(pluginCfg);
  return `In the groups, the following audit ref's needs to point to a audit in this plugin config: ${errorItems(
    missingRefs,
  )}`;
}
function getMissingRefsFromGroups(pluginCfg: _PluginCfg) {
  if (pluginCfg?.groups?.length && pluginCfg?.audits?.length) {
    const groups = pluginCfg?.groups || [];
    const audits = pluginCfg?.audits || [];
    return hasMissingStrings(
      groups.flatMap(({ refs: audits }) => audits.map(({ slug: ref }) => ref)),
      audits.map(({ slug }) => slug),
    );
  }
  return false;
}

// =======

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

export const auditOutputSchema = z.object(
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
export type AuditOutput = z.infer<typeof auditOutputSchema>;

export type PluginOutput = PluginRunnerOutput & {
  slug: string;
  date: string;
  duration: number;
};
export const pluginRunnerOutputSchema = z.object(
  {
    audits: z
      .array(auditOutputSchema, { description: 'List of audits' })
      // audit slugs are unique
      .refine(
        audits => !getDuplicateSlugsInAudits(audits),
        audits => ({ message: duplicateSlugsInAuditsErrorMsg(audits) }),
      ),
  },
  { description: 'JSON formatted output emitted by the runner.' },
);
export type PluginRunnerOutput = z.infer<typeof pluginRunnerOutputSchema>;

// helper for validator: audit slugs are unique
function duplicateSlugsInAuditsErrorMsg(audits: AuditOutput[]) {
  const duplicateRefs = getDuplicateSlugsInAudits(audits);
  return `In plugin audits the slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateSlugsInAudits(audits: AuditOutput[]) {
  return hasDuplicateStrings(audits.map(({ slug }) => slug));
}

type _RefsList = { slug?: string }[];

// helper for validator: group refs are unique
function duplicateRefsInGroupsErrorMsg(groupAudits: _RefsList) {
  const duplicateRefs = getDuplicateRefsInGroups(groupAudits);
  return `In plugin groups the audit refs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateRefsInGroups(groupAudits: _RefsList) {
  return hasDuplicateStrings(
    groupAudits.map(({ slug: ref }) => ref).filter(exists),
  );
}
