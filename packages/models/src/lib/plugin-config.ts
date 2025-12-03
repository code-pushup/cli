import { z } from 'zod';
import { type Audit, pluginAuditsSchema } from './audit.js';
import { type Group, groupsSchema } from './group.js';
import { createCheck } from './implementation/checks.js';
import {
  materialIconSchema,
  metaSchema,
  packageVersionSchema,
  scoreTargetSchema,
  slugSchema,
  weightSchema,
} from './implementation/schemas.js';
import { formatSlugsList, hasMissingStrings } from './implementation/utils.js';
import { runnerConfigSchema, runnerFunctionSchema } from './runner-config.js';

export const pluginContextSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .meta({
    title: 'PluginContext',
    description: 'Plugin-specific context data for helpers',
  });

export type PluginContext = z.infer<typeof pluginContextSchema>;

export const pluginMetaSchema = packageVersionSchema()
  .extend(
    metaSchema({
      titleDescription: 'Descriptive name',
      descriptionDescription: 'Description (markdown)',
      docsUrlDescription: 'Plugin documentation site',
      description: 'Plugin metadata',
    }).shape,
  )
  .extend({
    slug: slugSchema.meta({
      description: 'Unique plugin slug within core config',
    }),
    icon: materialIconSchema,
  })
  .meta({ title: 'PluginMeta' });

export type PluginMeta = z.infer<typeof pluginMetaSchema>;

export const pluginScoreTargetsSchema = z
  .union([
    scoreTargetSchema,
    z.record(z.string(), scoreTargetSchema.nonoptional()),
  ])
  .optional()
  .meta({
    title: 'PluginScoreTargets',
    description:
      'Score targets that trigger a perfect score. Number for all audits or record { slug: target } for specific audits',
  });

export type PluginScoreTargets = z.infer<typeof pluginScoreTargetsSchema>;

export const pluginDataSchema = z
  .object({
    runner: z.union([runnerConfigSchema, runnerFunctionSchema]),
    audits: pluginAuditsSchema,
    groups: groupsSchema,
    scoreTargets: pluginScoreTargetsSchema,
    context: pluginContextSchema,
  })
  .meta({ title: 'PluginData' });

export const pluginConfigSchema = pluginMetaSchema
  .extend(pluginDataSchema.shape)
  .check(createCheck(findMissingSlugsInGroupRefs))
  .meta({ title: 'PluginConfig' });

export type PluginConfig = z.infer<typeof pluginConfigSchema>;

export const pluginUrlsSchema = z
  .union([z.url(), z.array(z.url()), z.record(z.url(), weightSchema)])
  .meta({
    title: 'PluginUrls',
    description:
      'URL(s) to analyze. Single URL, array of URLs, or record of URLs with custom weights',
  });

export type PluginUrls = z.infer<typeof pluginUrlsSchema>;

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
