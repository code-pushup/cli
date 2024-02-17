import { z } from 'zod';
import { pluginAuditsSchema } from './audit';
import { groupsSchema } from './group';
import {
  materialIconSchema,
  metaSchema,
  packageVersionSchema,
  slugSchema,
} from './implementation/schemas';
import { errorItems, hasMissingStrings } from './implementation/utils';
import { runnerConfigSchema, runnerFunctionSchema } from './runner-config';

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
