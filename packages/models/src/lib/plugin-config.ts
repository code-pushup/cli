import { z } from 'zod';
import {
  descriptionSchema,
  docsUrlSchema,
  generalFilePathSchema, positiveIntSchema,
  scorableSchema,
  slugSchema,
  titleSchema, unixFilePathSchema,
  weightedRefSchema,
} from './implementation/schemas';
import {
  errorItems,
  exists,
  hasDuplicateStrings,
  hasMissingStrings,
} from './implementation/utils';

// Define Zod schema for the PluginMetadata type
export const pluginMetadataSchema = z.object(
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

        audits => !getDuplicateSlugsInAudits(audits),
        audits => ({
          message: duplicateSlugsInAuditsErrorMsg(audits),
        }),
      ),
  },
  { description: 'JSON formatted output emitted by the runner.' },
);

export type RunnerOutput = z.infer<typeof runnerOutputSchema>;



// Define Zod schema for the AuditMetadata type
export const auditMetadataSchema = z.object(
  {
    slug: slugSchema('Audit slug (unique within plugin)'),
    label: z
      .string({
        description: 'Abbreviated name',
      })
      .max(256),
    title: titleSchema('Descriptive name'),
    description: descriptionSchema('Description (Markdown)'),
    docsUrl: docsUrlSchema('Link to documentation (rationale)'),
  },
  { description: 'List of scorable metrics for the given plugin' },
);

export type AuditMetadata = z.infer<typeof auditMetadataSchema>;


export const auditReportSchema = auditResultSchema.merge(auditMetadataSchema);
export type AuditReport = z.infer<typeof auditReportSchema>;


// Define Zod schema for the `Group` type
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
        auditMetadata => !getDuplicateSlugsInAudits(auditMetadata as never),
        auditMetadata => ({
          message: duplicateSlugsInAuditsErrorMsg(auditMetadata as never),
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

export type PluginOutput = RunnerOutput & {
  slug: string;
  date: string;
  duration: number;
};

export type PluginConfig = z.infer<typeof pluginConfigSchema>;

// helper for validator: audit slugs are unique
type _Audit = {slug: string};
function duplicateSlugsInAuditsErrorMsg(audits: _Audit[]) {
  const duplicateRefs = getDuplicateSlugsInAudits(audits);
  return `In the report audits the slugs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateSlugsInAudits(audits: _Audit[]) {
  return hasDuplicateStrings(audits.map(({ slug }) => slug));
}

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

type RefsList = { slug?: string }[];

// helper for validator: group refs are unique
function duplicateRefsInGroupsErrorMsg(groupAudits: RefsList) {
  const duplicateRefs = getDuplicateRefsInGroups(groupAudits);
  return `In plugin groups the audit refs are not unique: ${errorItems(
    duplicateRefs,
  )}`;
}
function getDuplicateRefsInGroups(groupAudits: RefsList) {
  return hasDuplicateStrings(
    groupAudits.map(({ slug: ref }) => ref).filter(exists),
  );
}
type PluginCfg = {
  audits?: AuditMetadata[];
  groups?: AuditGroup[];
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
      groups.flatMap(({ refs: audits }) => audits.map(({ slug: ref }) => ref)),
      audits.map(({ slug }) => slug),
    );
  }
  return false;
}
