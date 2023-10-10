import { MATERIAL_ICONS, MaterialIcon } from '@code-pushup/portal-client';
import { z } from 'zod';
import {
  executionMetaSchema,
  generalFilePathSchema,
  metaSchema,
  packageVersionSchema,
  positiveIntSchema,
  scorableSchema,
  slugSchema,
  unixFilePathSchema,
  weightedRefSchema,
} from './implementation/schemas';
import {
  errorItems,
  exists,
  hasDuplicateStrings,
  hasMissingStrings,
} from './implementation/utils';

export const materialIconSchema = z.enum(
  MATERIAL_ICONS as [MaterialIcon, MaterialIcon, ...MaterialIcon[]],
  { description: 'Icon from VSCode Material Icons extension' },
);

export const pluginSchema = packageVersionSchema({
  optional: true,
})
  .merge(
    metaSchema({
      titleDescription: 'Descriptive name',
      descriptionDescription: 'Description (markdown)',
      docsUrlDescription: 'Plugin documentation site',
      description: 'Plugin metadata',
    }),
  )
  .merge(
    z.object({
      slug: slugSchema('References plugin. ID (unique within core config)'),
      icon: materialIconSchema,
    }),
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

export const auditSchema = z
  .object({
    slug: slugSchema('ID (unique within plugin)'),
  })
  .merge(
    metaSchema({
      titleDescription: 'Descriptive name',
      descriptionDescription: 'Description (markdown)',
      docsUrlDescription: 'Link to documentation (rationale)',
      description: 'List of scorable metrics for the given plugin',
    }),
  );

export type Audit = z.infer<typeof auditSchema>;

export const auditGroupSchema = scorableSchema(
  'An audit group aggregates a set of audits into a single score which can be referenced from a category. ' +
    'E.g. the group slug "performance" groups audits and can be referenced in a category as "[plugin-slug]#group:[group-slug]")',
  weightedRefSchema(
    'Weighted references to audits',
    "Reference slug to an audit within this plugin (e.g. 'max-lines')",
  ),
  getDuplicateRefsInGroups,
  duplicateRefsInGroupsErrorMsg,
).merge(
  metaSchema({
    titleDescription: 'Descriptive name for the group',
    descriptionDescription: 'Description of the group (markdown)',
    docsUrlDescription: 'Group documentation site',
    description: 'Group metadata',
  }),
);
export type AuditGroup = z.infer<typeof auditGroupSchema>;

export const pluginConfigSchema = z
  .object({
    runner: runnerConfigSchema,
    audits: z
      .array(auditSchema, {
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
  .merge(pluginSchema)
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
  audits?: Audit[];
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

export const auditOutputSchema = auditSchema.merge(
  z.object(
    {
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
  ),
);
export type AuditOutput = z.infer<typeof auditOutputSchema>;

export const auditOutputsSchema = z
  .array(auditOutputSchema, {
    description:
      'List of JSON formatted audit output emitted by the runner process of a plugin',
  })
  // audit slugs are unique
  .refine(
    audits => !getDuplicateSlugsInAudits(audits),
    audits => ({ message: duplicateSlugsInAuditsErrorMsg(audits) }),
  );
export type AuditOutputs = z.infer<typeof auditOutputsSchema>;

export const pluginOutputSchema = pluginSchema
  .merge(executionMetaSchema())
  .merge(
    z.object(
      {
        audits: auditOutputsSchema,
      },
      {
        description:
          'List of JSON formatted audit output emitted by the runner process of a plugin',
      },
    ),
  );

export type PluginOutput = z.infer<typeof pluginOutputSchema>;

// helper for validator: audit slugs are unique
function duplicateSlugsInAuditsErrorMsg(audits: { slug: string }[]) {
  const duplicateRefs = getDuplicateSlugsInAudits(audits);
  return `In plugin audits the slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}

function getDuplicateSlugsInAudits(audits: { slug: string }[]) {
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
