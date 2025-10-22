import { z } from 'zod';
import {
  createDuplicateSlugsCheck,
  createDuplicatesCheck,
} from './implementation/checks.js';
import {
  metaSchema,
  scorableSchema,
  scoreTargetSchema,
  slugSchema,
  weightedRefSchema,
} from './implementation/schemas.js';
import { formatRef } from './implementation/utils.js';

export const categoryRefSchema = weightedRefSchema(
  'Weighted references to audits and/or groups for the category',
  'Slug of an audit or group (depending on `type`)',
).extend({
  type: z.enum(['audit', 'group']).meta({
    description:
      'Discriminant for reference kind, affects where `slug` is looked up',
  }),
  plugin: slugSchema.describe(
    'Plugin slug (plugin should contain referenced audit or group)',
  ),
});
export type CategoryRef = z.infer<typeof categoryRefSchema>;

export const categoryConfigSchema = scorableSchema(
  'Category with a score calculated from audits and groups from various plugins',
  categoryRefSchema,
  createDuplicatesCheck(
    serializeCategoryRefTarget,
    duplicates =>
      `Category has duplicate references: ${formatSerializedCategoryRefTargets(duplicates)}`,
  ),
)
  .extend(
    metaSchema({
      titleDescription: 'Category Title',
      docsUrlDescription: 'Category docs URL',
      descriptionDescription: 'Category description',
      description: 'Meta info for category',
    }).shape,
  )
  .extend({ scoreTarget: scoreTargetSchema });

export type CategoryConfig = z.infer<typeof categoryConfigSchema>;

const CATEGORY_REF_SEP = '||';

function serializeCategoryRefTarget(ref: CategoryRef): string {
  return [ref.type, ref.plugin, ref.slug].join(CATEGORY_REF_SEP);
}

function formatSerializedCategoryRefTargets(keys: string[]): string {
  return keys
    .map(key => {
      const [type, plugin, slug] = key.split(CATEGORY_REF_SEP) as [
        'group' | 'audit',
        string,
        string,
      ];
      return formatRef({ type, plugin, slug });
    })
    .join(', ');
}

export const categoriesSchema = z
  .array(categoryConfigSchema)
  .check(createDuplicateSlugsCheck('Category'))
  .meta({ description: 'Categorization of individual audits' });
