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
  details,
  h2,
  h3,
  headline,
  indentation,
  li,
  link,
  paragraphs,
  style,
} from './md';
import { section } from './md/section';
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
        score: `${scoreMarker(score)} ${style(formatReportScore(score))}`,
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
    const categoryScore = `${scoreMarker(category.score)} Score:  ${style(
      formatReportScore(category.score),
    )}`;

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
    `${marker} ${auditTitleAsLink} (_${pluginTitle}_) - ${style(
      (displayValue || value).toString(),
    )}`,
  );
}

export function categoryGroupItem(
  { score = 0, title }: ScoredGroup,
  groupAudits: AuditReport[],
  pluginTitle: string,
): string {
  const groupTitle = li(`${scoreMarker(score)} ${title} (_${pluginTitle}_)`);
  const auditTitles = groupAudits.map(
    ({ title: auditTitle, score: auditScore, value, displayValue }) => {
      const auditTitleLink = link(
        `#${slugify(auditTitle)}-${slugify(pluginTitle)}`,
        auditTitle,
      );
      const marker = scoreMarker(auditScore, 'square');
      return indentation(
        li(
          `${marker} ${auditTitleLink} - ${style(
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
  const marker = scoreMarker(score, 'square');
  const auditDisplayValue = String(displayValue ?? value);
  return `${marker} ${htmlFontStyle(
    auditDisplayValue,
  )} (score: ${formatReportScore(score)})`;
}

export function generateMdReport(report: ScoredReport): string {
  const printCategories = report.categories.length > 0;

  return paragraphs(
    // header section
    headline(reportHeadlineText),
    // categories overview section
    printCategories ? reportOverviewSection(report) : '',
    // categories section
    printCategories ? categoriesDetailsSection(report) : '',
    // audits section
    auditsSection(report),
    // about section
    aboutSection(report),
    // footer section
    `${FOOTER_PREFIX} ${link(README_LINK, 'Code PushUp')}`,
  );
}

export function auditDetailsIssues(issues: Issue[] = []) {
  if (issues.length === 0) {
    return '';
  }
  type ItemKeys = (typeof issuesTableHeadings)[number]['key'];
  const detailsTableData = {
    headings: issuesTableHeadings,
    rows: issues.map((issue: Issue) => {
      const severity = `${severityMarker(issue.severity)} <i>${
        issue.severity
      }</i>`;
      const message = issue.message;

      if (!issue.source) {
        return { severity, message, file: '', line: '' } satisfies Partial<
          Record<ItemKeys, string>
        >;
      }
      // TODO: implement file links, ticket #149
      const file = `<code>${issue.source.file}</code>`;
      if (!issue.source.position) {
        return { severity, message, file, line: '' };
      }
      const { startLine, endLine } = issue.source.position;
      const line = `${startLine || ''}${
        endLine && startLine !== endLine ? `-${endLine}` : ''
      }`;
      return { severity, message, file, line };
    }),
  };

  return tableSection(detailsTableData, { heading: 'Issues' });
}

export function auditDetails(audit: AuditReport) {
  const detailsValue = auditDetailsAuditValue(audit);

  if (!audit.details) {
    return detailsValue;
  }

  const { table, issues } = audit.details;
  if (issues && issues.length === 0 && table == null) {
    return detailsValue;
  }
  const tableSectionContent =
    table == null
      ? ''
      : tableSection(table, { heading: 'Additional Information' });
  const issuesSectionContent =
    issues && issues.length > 0 ? auditDetailsIssues(issues) : '';

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
    return section(description, docsLink);
  }
  if (description) {
    return section(description);
  }
  return '';
}

export function auditsSection({
  plugins,
}: Pick<ScoredReport, 'plugins'>): string {
  const content = plugins.flatMap(({ slug, audits }) =>
    audits.flatMap(audit => {
      const auditTitle = `${audit.title} (${getPluginNameFromSlug(
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
  const commitInfo = commit ? `${commit.message} (${commit.hash})` : 'N/A';

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
