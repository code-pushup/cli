import { AuditReport, Issue, Report, Table } from '@code-pushup/models';
import { formatDate, formatDuration, slugify } from '../formatting';
import {
  CATEGORIES_TITLE,
  FOOTER_PREFIX,
  README_LINK,
  issuesTableHeadings,
  pluginMetaTableAlignment,
  pluginMetaTableHeaders,
  reportHeadlineText,
  reportMetaTableAlignment,
  reportMetaTableHeaders,
  reportOverviewTableAlignment,
  reportOverviewTableHeaders,
} from './constants';
import { tableSection } from './formatting';
import { style as htmlFontStyle } from './html/font-style';
import {
  NEW_LINE,
  SPACE,
  details,
  h1,
  h2,
  h3,
  indentation,
  li,
  link,
  paragraphs,
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
  severityMarker,
} from './utils';

export function reportOverviewSection(
  report: Pick<ScoredReport, 'categories' | 'plugins'>,
): string {
  const { categories, plugins } = report;
  if (categories.length > 0 && plugins.length > 0) {
    const tableContent: Table = {
      headings: reportOverviewTableHeaders,
      rows: categories.map(({ title, refs, score }) => ({
        // @TODO shouldn't this be the category slug as title is not unique? => slugify(title) -> slug
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
        return paragraphs(categoryGroupItem(group, groupAudits, pluginTitle));
      }
      // Add audit details
      else {
        const audit = getSortableAuditByRef(ref, plugins);
        const pluginTitle = getPluginNameFromSlug(ref.plugin, plugins);
        return paragraphs(categoryRef(audit, pluginTitle));
      }
    });

    return section(
      categoryTitle,
      metaDescription(category),
      categoryScore,
      ...categoryMDItems,
    );
  });

  return paragraphs(h2(CATEGORIES_TITLE), ...categoryDetails);
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

  return paragraphs(groupTitle, ...auditTitles);
}

export function auditDetailsAuditValue({
  score,
  value,
  displayValue,
}: AuditReport) {
  return `${scoreMarker(score, 'square')} ${htmlFontStyle(
    String(displayValue ?? value),
  )} (score: ${formatReportScore(score)})`;
}

export function generateMdReport(report: ScoredReport): string {
  const printCategories = report.categories.length > 0;

  return paragraphs(
    h1(reportHeadlineText),
    printCategories ? reportOverviewSection(report) : '',
    printCategories ? categoriesDetailsSection(report) : '',
    auditsSection(report),
    aboutSection(report),
    `${FOOTER_PREFIX}${SPACE}${link(README_LINK, 'Code PushUp')}`,
  );
}

export function auditDetailsIssues(issues: Issue[] = []) {
  if (issues.length === 0) {
    return '';
  }
  const detailsTableData = {
    headings: issuesTableHeadings,
    rows: issues.map(
      ({ severity: severityVal, message, source: sourceVal }: Issue) => {
        const severity = `${severityMarker(severityVal)} <i>${severityVal}</i>`;

        if (!sourceVal) {
          return { severity, message, file: '', line: '' };
        }
        // TODO: implement file links, ticket #149
        const file = `<code>${sourceVal.file}</code>`;
        if (!sourceVal.position) {
          return { severity, message, file, line: '' };
        }
        const { startLine, endLine } = sourceVal.position;
        const line = `${startLine || ''}${
          endLine && startLine !== endLine ? `-${endLine}` : ''
        }`;
        return { severity, message, file, line };
      },
    ),
  };

  return tableSection(detailsTableData, { heading: 'Issues' });
}

export function auditDetails(audit: AuditReport) {
  const { table, issues = [] } = audit.details ?? {};
  const detailsValue = auditDetailsAuditValue(audit);

  // undefined details OR empty details (undefined issues OR empty issues AND empty table)
  if (issues.length === 0 && table == null) {
    return section(detailsValue);
  }

  const tableSectionContent =
    table == null
      ? ''
      : tableSection(table, { heading: 'Additional Information' });
  const issuesSectionContent =
    issues.length > 0 ? auditDetailsIssues(issues) : '';

  return details(
    detailsValue,
    paragraphs(tableSectionContent, issuesSectionContent),
  );
}

// @TODO extract `Pick<AuditReport, 'docsUrl' | 'description'>` to a reusable schema and type
export function metaDescription({
  docsUrl,
  description,
}: Pick<AuditReport, 'docsUrl' | 'description'>): string {
  if (docsUrl) {
    const docsLink = link(docsUrl, '📖 Docs');
    if (!description) {
      return section(docsLink);
    }
    const parsedDescription = description.toString().endsWith('```')
      ? `${description}${NEW_LINE + NEW_LINE}`
      : `${description}${SPACE}`;
    return section(`${parsedDescription}${docsLink}`);
  }
  if (description && description.trim().length > 0) {
    return section(description);
  }
  return '';
}

export function auditsSection({
  plugins,
}: Pick<ScoredReport, 'plugins'>): string {
  const content = plugins.flatMap(({ slug, audits }) =>
    audits.flatMap(audit => {
      const auditTitle = `${audit.title}${SPACE}(${getPluginNameFromSlug(
        slug,
        plugins,
      )})`;
      const detailsContent = auditDetails(audit);
      const descriptionContent = metaDescription(audit);
      return [h3(auditTitle), detailsContent, descriptionContent];
    }),
  );

  return section(h2('🛡️ Audits'), ...content);
}

export function aboutSection(
  report: Omit<ScoredReport, 'packageName'>,
): string {
  const { date, plugins } = report;

  const formattedDate = formatDate(new Date(date));
  const reportMetaTable = reportMetaData(report);

  const pluginMetaTable = reportPluginMeta({ plugins });
  const level = 3;
  return paragraphs(
    h2('About'),
    section(
      `Report was created by [Code PushUp](${README_LINK}) on ${formattedDate}.`,
    ),
    tableSection(reportMetaTable, { heading: 'Report overview:', level }),
    tableSection(pluginMetaTable, { heading: 'Plugins overview:', level }),
  );
}

export function reportPluginMeta({ plugins }: Pick<Report, 'plugins'>) {
  return {
    headings: pluginMetaTableHeaders,
    rows: plugins.map(
      ({
        title: pluginTitle,
        audits,
        version: pluginVersion,
        duration: pluginDuration,
      }) => ({
        plugin: pluginTitle,
        audits: audits.length.toString(),
        version: style(pluginVersion || '', ['c']),
        duration: formatDuration(pluginDuration),
      }),
    ),
    alignment: pluginMetaTableAlignment,
  };
}

export function reportMetaData({
  commit,
  version,
  duration,
  plugins,
  categories,
}: Pick<
  ScoredReport,
  'date' | 'duration' | 'version' | 'commit' | 'plugins' | 'categories'
>): Table {
  const commitInfo = commit
    ? `${commit.message}${SPACE}(${commit.hash})`
    : 'N/A';

  return {
    headings: reportMetaTableHeaders,
    rows: [
      {
        commit: commitInfo,
        version: style(version || '', ['c']),
        duration: formatDuration(duration),
        plugins: plugins.length,
        categories: categories.length,
        audits: plugins
          .reduce((acc, { audits }) => acc + audits.length, 0)
          .toString(),
      },
    ],
    alignment: reportMetaTableAlignment,
  };
}
