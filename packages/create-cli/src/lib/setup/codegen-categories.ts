import type { CategoryRef } from '@code-pushup/models';
import { mergeDescriptions, singleQuote } from '@code-pushup/utils';
import type { CodeBuilder } from './codegen.js';
import type { CategoryCodegenConfig, PluginCodegenResult } from './types.js';

type MergedCategory = {
  slug: string;
  title: string;
  description?: string;
  docsUrl?: string;
  refs: CategoryRef[];
  refsExpressions: string[];
};

export function addCategories(
  builder: CodeBuilder,
  plugins: PluginCodegenResult[],
  depth = 1,
): void {
  const categories = mergeCategoriesBySlug(
    plugins.flatMap(p => p.categories ?? []).map(toMergedCategory),
  );
  if (categories.length === 0) {
    return;
  }
  builder.addLine('categories: [', depth);
  categories.forEach(
    ({ slug, title, description, docsUrl, refs, refsExpressions }) => {
      builder.addLine('{', depth + 1);
      builder.addLine(`slug: '${slug}',`, depth + 2);
      builder.addLine(`title: ${singleQuote(title)},`, depth + 2);
      if (description) {
        builder.addLine(`description: ${singleQuote(description)},`, depth + 2);
      }
      if (docsUrl) {
        builder.addLine(`docsUrl: ${singleQuote(docsUrl)},`, depth + 2);
      }
      addCategoryRefs(builder, refs, refsExpressions, depth + 2);
      builder.addLine('},', depth + 1);
    },
  );
  builder.addLine('],', depth);
}

function toMergedCategory(category: CategoryCodegenConfig): MergedCategory {
  return {
    slug: category.slug,
    title: category.title,
    description: category.description,
    docsUrl: category.docsUrl,
    refs: 'refs' in category ? category.refs : [],
    refsExpressions:
      'refsExpression' in category ? [category.refsExpression] : [],
  };
}

function mergeCategoriesBySlug(categories: MergedCategory[]): MergedCategory[] {
  const map = categories.reduce((acc, category) => {
    const existing = acc.get(category.slug);
    acc.set(
      category.slug,
      existing ? mergeCategory(existing, category) : category,
    );
    return acc;
  }, new Map<string, MergedCategory>());
  return [...map.values()];
}

function mergeCategory(
  existing: MergedCategory,
  incoming: MergedCategory,
): MergedCategory {
  return {
    ...existing,
    description: mergeDescriptions(existing.description, incoming.description),
    docsUrl: existing.docsUrl ?? incoming.docsUrl,
    refs: [...existing.refs, ...incoming.refs],
    refsExpressions: [...existing.refsExpressions, ...incoming.refsExpressions],
  };
}

function addCategoryRefs(
  builder: CodeBuilder,
  refs: MergedCategory['refs'],
  refsExpressions: MergedCategory['refsExpressions'],
  depth: number,
): void {
  builder.addLine('refs: [', depth);
  builder.addLines(
    refsExpressions.map(expr => `...${expr},`),
    depth + 1,
  );
  builder.addLines(refs.map(formatCategoryRef), depth + 1);
  builder.addLine('],', depth);
}

function formatCategoryRef(ref: CategoryRef): string {
  return `{ type: '${ref.type}', plugin: '${ref.plugin}', slug: '${ref.slug}', weight: ${ref.weight} },`;
}
