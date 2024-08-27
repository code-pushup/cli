import { type InlineText, MarkdownDocument, md } from 'build-md';
import type { AuditReport } from '@code-pushup/models';
import { slugify } from '../formatting';
import { HIERARCHY } from '../text-formats';
import { metaDescription } from './formatting';
import { getSortableAuditByRef, getSortableGroupByRef } from './sorting';
import type { ScoredGroup, ScoredReport } from './types';
import {
  countCategoryAudits,
  formatReportScore,
  getPluginNameFromSlug,
  scoreMarker,
  targetScoreIcon,
} from './utils';

export function categoriesOverviewSection(
  report: Pick<ScoredReport, 'categories' | 'plugins'>,
): MarkdownDocument {
  const { categories, plugins } = report;
  return new MarkdownDocument().table(
    [
      { heading: '🏷 Category', alignment: 'left' },
      { heading: '⭐ Score', alignment: 'center' },
      { heading: '🛡 Audits', alignment: 'center' },
    ],
    categories.map(({ title, refs, score, isBinary }) => [
      // @TODO refactor `isBinary: boolean` to `targetScore: number` #713
      // The heading "ID" is inferred from the heading text in Markdown.
      md.link(`#${slugify(title)}`, title),
      md`${scoreMarker(score)} ${md.bold(
        formatReportScore(score),
      )}${binaryIconSuffix(score, isBinary)}`,
      countCategoryAudits(refs, plugins).toString(),
    ]),
  );
}

export function categoriesDetailsSection(
  report: Pick<ScoredReport, 'categories' | 'plugins'>,
): MarkdownDocument {
  const { categories, plugins } = report;

  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, '🏷 Categories')
    .$foreach(categories, (doc, category) =>
      doc
        .heading(HIERARCHY.level_3, category.title)
        .paragraph(metaDescription(category))
        .paragraph(
          md`${scoreMarker(category.score)} Score: ${md.bold(
            formatReportScore(category.score),
          )}${binaryIconSuffix(category.score, category.isBinary)}`,
        )
        .list(
          category.refs.map(ref => {
            // Add group details
            if (ref.type === 'group') {
              const group = getSortableGroupByRef(ref, plugins);
              const groupAudits = group.refs.map(groupRef =>
                getSortableAuditByRef(
                  { ...groupRef, plugin: group.plugin, type: 'audit' },
                  plugins,
                ),
              );
              const pluginTitle = getPluginNameFromSlug(ref.plugin, plugins);
              return categoryGroupItem(group, groupAudits, pluginTitle);
            }
            // Add audit details
            else {
              const audit = getSortableAuditByRef(ref, plugins);
              const pluginTitle = getPluginNameFromSlug(ref.plugin, plugins);
              return categoryRef(audit, pluginTitle);
            }
          }),
        ),
    );
}

export function categoryRef(
  { title, score, value, displayValue }: AuditReport,
  pluginTitle: string,
): InlineText {
  const auditTitleAsLink = md.link(
    `#${slugify(title)}-${slugify(pluginTitle)}`,
    title,
  );
  const marker = scoreMarker(score, 'square');
  return md`${marker} ${auditTitleAsLink} (${md.italic(
    pluginTitle,
  )}) - ${md.bold((displayValue || value).toString())}`;
}

export function categoryGroupItem(
  { score = 0, title }: ScoredGroup,
  groupAudits: AuditReport[],
  pluginTitle: string,
): InlineText {
  const groupTitle = md`${scoreMarker(score)} ${title} (${md.italic(
    pluginTitle,
  )})`;

  const auditsList = md.list(
    groupAudits.map(
      ({ title: auditTitle, score: auditScore, value, displayValue }) => {
        const auditTitleLink = md.link(
          `#${slugify(auditTitle)}-${slugify(pluginTitle)}`,
          auditTitle,
        );
        const marker = scoreMarker(auditScore, 'square');
        return md`${marker} ${auditTitleLink} - ${md.bold(
          String(displayValue ?? value),
        )}`;
      },
    ),
  );

  return md`${groupTitle}${auditsList}`;
}

export function binaryIconSuffix(
  score: number,
  isBinary: boolean | undefined,
): string {
  // @TODO refactor `isBinary: boolean` to `targetScore: number` #713
  return targetScoreIcon(score, isBinary ? 1 : undefined, { prefix: ' ' });
}
