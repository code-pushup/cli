import { z } from 'zod';
import { auditOutputSchema } from './audit-output.js';
import { auditSchema } from './audit.js';
import { categoryConfigSchema } from './category-config.js';
import { commitSchema } from './commit.js';
import { type Group, groupSchema } from './group.js';
import {
  executionMetaSchema,
  packageVersionSchema,
} from './implementation/schemas.js';
import {
  errorItems,
  getMissingRefsForCategories,
  hasMissingStrings,
  missingRefsForCategoriesErrorMsg,
} from './implementation/utils.js';
import { pluginMetaSchema } from './plugin-config.js';

export const auditReportSchema = auditSchema.merge(auditOutputSchema);
export type AuditReport = z.infer<typeof auditReportSchema>;

export const pluginReportSchema = pluginMetaSchema
  .merge(
    executionMetaSchema({
      descriptionDate: 'Start date and time of plugin run',
      descriptionDuration: 'Duration of the plugin run in ms',
    }),
  )
  .merge(
    z.object({
      audits: z.array(auditReportSchema).min(1),
      groups: z.array(groupSchema).optional(),
    }),
  )
  .refine(
    pluginReport =>
      !getMissingRefsFromGroups(pluginReport.audits, pluginReport.groups ?? []),
    pluginReport => ({
      message: missingRefsFromGroupsErrorMsg(
        pluginReport.audits,
        pluginReport.groups ?? [],
      ),
    }),
  );

export type PluginReport = z.infer<typeof pluginReportSchema>;

// every listed group ref points to an audit within the plugin report
function missingRefsFromGroupsErrorMsg(audits: AuditReport[], groups: Group[]) {
  const missingRefs = getMissingRefsFromGroups(audits, groups);
  return `group references need to point to an existing audit in this plugin report: ${errorItems(
    missingRefs,
  )}`;
}

function getMissingRefsFromGroups(audits: AuditReport[], groups: Group[]) {
  return hasMissingStrings(
    groups.flatMap(({ refs: auditRefs }) =>
      auditRefs.map(({ slug: ref }) => ref),
    ),
    audits.map(({ slug }) => slug),
  );
}

export const reportSchema = packageVersionSchema({
  versionDescription: 'NPM version of the CLI',
  required: true,
})
  .merge(
    executionMetaSchema({
      descriptionDate: 'Start date and time of the collect run',
      descriptionDuration: 'Duration of the collect run in ms',
    }),
  )
  .merge(
    z.object(
      {
        plugins: z.array(pluginReportSchema).min(1),
        categories: z.array(categoryConfigSchema).optional(),
        commit: commitSchema
          .describe('Git commit for which report was collected')
          .nullable(),
      },
      { description: 'Collect output data' },
    ),
  )
  .refine(
    ({ categories, plugins }) =>
      !getMissingRefsForCategories(categories, plugins),
    ({ categories, plugins }) => ({
      message: missingRefsForCategoriesErrorMsg(categories, plugins),
    }),
  );

export type Report = z.infer<typeof reportSchema>;
