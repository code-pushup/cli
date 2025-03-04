import { type InlineText, MarkdownDocument, md } from 'build-md';
import type { AuditReport } from '@code-pushup/models';
import { slugify } from '../formatting.js';
import { HIERARCHY } from '../text-formats/index.js';
import { metaDescription } from './formatting.js';
import { getSortableAuditByRef, getSortableGroupByRef } from './sorting.js';
import type { ScoreFilter, ScoredGroup, ScoredReport } from './types.js';
import {
  countCategoryAudits,
  formatReportScore,
  getPluginNameFromSlug,
  scoreMarker,
  targetScoreIcon,
} from './utils.js';

export function categoriesOverviewSection(
  report: Required<Pick<ScoredReport, 'plugins' | 'categories'>>,
  options?: ScoreFilter,
): MarkdownDocument {
  const { isScoreListed = (_: number) => true } = options ?? {};
  const { categories, plugins } = report;
  return new MarkdownDocument().table(
    [
      { heading: '🏷 Category', alignment: 'left' },
      { heading: '⭐ Score', alignment: 'center' },
      { heading: '🛡 Audits', alignment: 'center' },
    ],
    categories
      .filter(({ score }) => isScoreListed(score))
      .map(({ title, refs, score, isBinary }) => [
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
  report: Required<Pick<ScoredReport, 'plugins' | 'categories'>>,
  options?: ScoreFilter,
): MarkdownDocument {
  const { isScoreListed = (_: number) => true } = options ?? {};
  const { categories, plugins } = report;

  return new MarkdownDocument()
    .heading(HIERARCHY.level_2, '🏷 Categories')
    .$foreach(
      categories.filter(({ score }) => isScoreListed(score)),
      (doc, category) =>
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
                return isScoreListed(group.score)
                  ? categoryGroupItem(group, groupAudits, pluginTitle)
                  : '';
              }
              // Add audit details
              else {
                const audit = getSortableAuditByRef(ref, plugins);
                const pluginTitle = getPluginNameFromSlug(ref.plugin, plugins);
                return isScoreListed(audit.score)
                  ? categoryRef(audit, pluginTitle)
                  : '';
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
