import { z } from 'zod';
import { type Audit, pluginAuditsSchema } from './audit.js';
import { type Group, groupsSchema } from './group.js';
import { createCheck } from './implementation/checks.js';
import {
  materialIconSchema,
  metaSchema,
  packageVersionSchema,
  slugSchema,
} from './implementation/schemas.js';
import { formatSlugsList, hasMissingStrings } from './implementation/utils.js';
import { runnerConfigSchema, runnerFunctionSchema } from './runner-config.js';

export const pluginContextSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .describe('Plugin-specific context data for helpers');
export type PluginContext = z.infer<typeof pluginContextSchema>;

export const pluginMetaSchema = packageVersionSchema()
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
      slug: slugSchema.describe('Unique plugin slug within core config'),
      icon: materialIconSchema,
    }),
  );
export type PluginMeta = z.infer<typeof pluginMetaSchema>;

export const pluginDataSchema = z.object({
  runner: z.union([runnerConfigSchema, runnerFunctionSchema]),
  audits: pluginAuditsSchema,
  groups: groupsSchema,
  context: pluginContextSchema,
});

export const pluginConfigSchema = pluginMetaSchema
  .merge(pluginDataSchema)
  .check(createCheck(findMissingSlugsInGroupRefs));

export type PluginConfig = z.infer<typeof pluginConfigSchema>;

// every listed group ref points to an audit within the plugin
export function findMissingSlugsInGroupRefs<
  T extends { audits: Audit[]; groups?: Group[] },
>({ audits, groups = [] }: T) {
  const missingSlugs = getAuditSlugsFromGroups(audits, groups);
  return (
    missingSlugs && {
      message: `Group references audits which don't exist in this plugin: ${formatSlugsList(
        missingSlugs,
      )}`,
    }
  );
}

function getAuditSlugsFromGroups(audits: Audit[], groups: Group[]) {
  return hasMissingStrings(
    groups.flatMap(({ refs }) => refs.map(({ slug }) => slug)),
    audits.map(({ slug }) => slug),
  );
}
