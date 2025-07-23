import { z } from 'zod';
import { pluginAuditsSchema } from './audit.js';
import { groupsSchema } from './group.js';
import {
  materialIconSchema,
  metaSchema,
  packageVersionSchema,
  slugSchema,
} from './implementation/schemas.js';
import { errorItems, hasMissingStrings } from './implementation/utils.js';
import { runnerConfigSchema, runnerFunctionSchema } from './runner-config.js';

export const pluginContextSchema = z
  .record(z.unknown())
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
type PluginData = z.infer<typeof pluginDataSchema>;

export const pluginConfigSchema = pluginMetaSchema
  .merge(pluginDataSchema)
  // every listed group ref points to an audit within the plugin
  .refine(
    pluginCfg => !getMissingRefsFromGroups(pluginCfg),
    pluginCfg => ({
      message: missingRefsFromGroupsErrorMsg(pluginCfg),
    }),
  );

export type PluginConfig = z.infer<typeof pluginConfigSchema>;

// helper for validator: every listed group ref points to an audit within the plugin
function missingRefsFromGroupsErrorMsg(pluginCfg: PluginData) {
  const missingRefs = getMissingRefsFromGroups(pluginCfg);
  return `The following group references need to point to an existing audit in this plugin config: ${errorItems(
    missingRefs,
  )}`;
}

function getMissingRefsFromGroups(pluginCfg: PluginData) {
  return hasMissingStrings(
    pluginCfg.groups?.flatMap(({ refs: audits }) =>
      audits.map(({ slug: ref }) => ref),
    ) ?? [],
    pluginCfg.audits.map(({ slug }) => slug),
  );
}
