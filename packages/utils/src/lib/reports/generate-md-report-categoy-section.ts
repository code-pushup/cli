import { AuditReport, Table } from '@code-pushup/models';
import { slugify } from '../formatting';
import {
  CATEGORIES_TITLE,
  reportOverviewTableAlignment,
  reportOverviewTableHeaders,
} from './constants';
import { metaDescription, tableSection } from './formatting';
import {
  SPACE,
  h2,
  h3,
  indentation,
  li,
  lines,
  link,
  section,
  style,
} from './md';
import { ScoredGroup, ScoredReport } from './types';
import {
  countCategoryAudits,
  formatReportScore,
  getPluginNameFromSlug,
  getSortableAuditByRef,
  getSortableGroupByRef,
  scoreMarker,
} from './utils';

export function categoriesOverviewSection(
  report: Pick<ScoredReport, 'categories' | 'plugins'>,
): string {
  const { categories, plugins } = report;
  if (categories.length > 0 && plugins.length > 0) {
    const tableContent: Table = {
      headings: reportOverviewTableHeaders,
      rows: categories.map(({ title, refs, score }) => ({
        // The heading "ID" is inferred from the heading text in Markdown.
        category: link(`#${slugify(title)}`, title),
        score: `${scoreMarker(score)}${SPACE}${style(
          formatReportScore(score),
        )}`,
        audits: countCategoryAudits(refs, plugins).toString(),
      })),
      alignment: reportOverviewTableAlignment,
    };
    return tableSection(tableContent);
  }
  return '';
}

export function categoriesDetailsSection(
  report: Pick<ScoredReport, 'categories' | 'plugins'>,
): string {
  const { categories, plugins } = report;

  const categoryDetails = categories.flatMap(category => {
    const categoryTitle = h3(category.title);
    const categoryScore = `${scoreMarker(
      category.score,
    )}${SPACE}Score:  ${style(formatReportScore(category.score))}`;

    const categoryMDItems = category.refs.map(ref => {
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
    });

    return section(
      categoryTitle,
      metaDescription(category),
      categoryScore,
      ...categoryMDItems,
    );
  });

  return lines(h2(CATEGORIES_TITLE), ...categoryDetails);
}

export function categoryRef(
  { title, score, value, displayValue }: AuditReport,
  pluginTitle: string,
): string {
  const auditTitleAsLink = link(
    `#${slugify(title)}-${slugify(pluginTitle)}`,
    title,
  );
  const marker = scoreMarker(score, 'square');
  return li(
    `${marker}${SPACE}${auditTitleAsLink}${SPACE}(_${pluginTitle}_) - ${style(
      (displayValue || value).toString(),
    )}`,
  );
}

export function categoryGroupItem(
  { score = 0, title }: ScoredGroup,
  groupAudits: AuditReport[],
  pluginTitle: string,
): string {
  const groupTitle = li(
    `${scoreMarker(score)}${SPACE}${title}${SPACE}(_${pluginTitle}_)`,
  );
  const auditTitles = groupAudits.map(
    ({ title: auditTitle, score: auditScore, value, displayValue }) => {
      const auditTitleLink = link(
        `#${slugify(auditTitle)}-${slugify(pluginTitle)}`,
        auditTitle,
      );
      const marker = scoreMarker(auditScore, 'square');
      return indentation(
        li(
          `${marker}${SPACE}${auditTitleLink} - ${style(
            String(displayValue ?? value),
          )}`,
        ),
      );
    },
  );

  return lines(groupTitle, ...auditTitles);
}
