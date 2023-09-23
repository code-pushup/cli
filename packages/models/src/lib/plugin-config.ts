import { z } from 'zod';
import {
  generalFilePathSchema,
  metaSchema,
  packageVersionSchema,
  scorableSchema,
  slugSchema,
  weightedRefSchema,
} from './implementation/schemas';
import {
  duplicateSlugsInAuditsErrorMsg,
  errorItems,
  exists,
  getDuplicateSlugsInAudits,
  hasDuplicateStrings,
  hasMissingStrings,
} from './implementation/utils';

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
      icon: z.union([z.unknown(), z.string()], {
        description: 'Icon from VSCode Material Icons extension',
      }),
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
