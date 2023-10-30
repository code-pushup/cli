import { z } from 'zod';
import {
  materialIconSchema,
  metaSchema,
  packageVersionSchema,
  slugSchema,
} from './implementation/schemas';
import { errorItems, hasMissingStrings } from './implementation/utils';
import { pluginAuditsSchema } from './plugin-config-audits';
import { auditGroupsSchema } from './plugin-config-groups';
import { runnerConfigSchema } from './plugin-config-runner';

export const pluginBaseSchema = packageVersionSchema({
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

export const pluginDataSchema = z.object({
  runner: runnerConfigSchema,
  audits: pluginAuditsSchema,
  groups: auditGroupsSchema,
});
type PluginData = z.infer<typeof pluginDataSchema>;

export const pluginConfigSchema = pluginBaseSchema
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
  return `In the groups, the following audit ref's needs to point to a audit in this plugin config: ${errorItems(
    missingRefs,
  )}`;
}

function getMissingRefsFromGroups(pluginCfg: PluginData) {
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
