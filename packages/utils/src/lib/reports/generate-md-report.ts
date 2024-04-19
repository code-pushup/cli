import {AuditReport, Issue, Report, Table} from '@code-pushup/models';
import {formatDate, formatDuration, slugify} from '../formatting';
import {
  CATEGORIES_TITLE,
  FOOTER_PREFIX,
  issuesTableHeadings,
  NEW_LINE,
  pluginMetaTableHeaders,
  README_LINK,
  reportHeadlineText,
  reportMetaTableHeaders,
  reportOverviewTableHeaders,
} from './constants';
import {styleBold, tableSection} from './formatting';
import {Alignment, details, h2, h3, headline, li, link, paragraphs, style,} from './md';
import {ScoredGroup, ScoredReport} from './types';
import {
  countCategoryAudits,
  formatReportScore,
  getPluginNameFromSlug,
  getSortableAuditByRef,
  getSortableGroupByRef,
  scoreMarker,
  severityMarker,
} from './utils';

export function reportOverview(
  report: Pick<ScoredReport, 'categories' | 'plugins'>,
): string {
  const {categories, plugins} = report;
  if (categories.length > 0 && plugins.length > 0) {
    const tableContent: Table = {
      headings: reportOverviewTableHeaders,
      rows: categories.map(({title, refs, score}) => ({
        // @TODO shouldn't this be the category slug?
        category: link(`#${slugify(title)}`, title),
        score: `${scoreMarker(score)} ${style(formatReportScore(score))}`,
        audits: countCategoryAudits(refs, plugins).toString(),
      })),
    };
    return tableSection(tableContent);
  }
  return '';
}

export function categoriesDetails(
  report: Pick<ScoredReport, 'categories' | 'plugins'>,
): string {
  const {categories, plugins} = report;

  const categoryDetails = categories.reduce((acc, category) => {
    const categoryTitle = h3(category.title);
    const categoryScore = `${scoreMarker(category.score)} Score:  ${style(
      formatReportScore(category.score),
    )}`;

    const categoryMDItems = category.refs.reduce((refAcc, ref) => {
      // @TODO add documentation
      if (ref.type === 'group') {
        const group = getSortableGroupByRef(ref, plugins);
        const groupAudits = group.refs.map(groupRef =>
          getSortableAuditByRef(
            {...groupRef, plugin: group.plugin, type: 'audit'},
            plugins,
          ),
        );
        const pluginTitle = getPluginNameFromSlug(ref.plugin, plugins);
        const mdGroupItem = categoryGroupItem(group, groupAudits, pluginTitle);
        return refAcc + mdGroupItem + NEW_LINE;
      } else {
        const audit = getSortableAuditByRef(ref, plugins);
        const pluginTitle = getPluginNameFromSlug(ref.plugin, plugins);
        const mdAuditItem = categoryRef(audit, pluginTitle);
        return refAcc + mdAuditItem + NEW_LINE;
      }
    }, '');
    const categoryDocs = metaDescription(category);

    return paragraphs(
      acc,
      categoryTitle,
      categoryDocs,
      categoryScore,
      categoryMDItems,
    );
  }, '');

  return paragraphs(h2(CATEGORIES_TITLE), categoryDetails);
}

export function categoryRef(
  {title, score, value, displayValue}: AuditReport,
  pluginTitle: string,
): string {
  const auditTitleAsLink = link(
    `#${slugify(title)}-${slugify(pluginTitle)}`,
    title,
  );
  return li(
    `${scoreMarker(
      score,
      'square',
    )} ${auditTitleAsLink} (_${pluginTitle}_) - ${styleBold({
      value,
      displayValue,
    })}`,
  );
}

export function categoryGroupItem(
  {score = 0, title}: ScoredGroup,
  groupAudits: AuditReport[],
  pluginTitle: string,
): string {
  const groupTitle = li(`${scoreMarker(score)} ${title} (_${pluginTitle}_)`);
  const auditTitles = groupAudits.reduce((acc, audit) => {
    const auditTitle = link(
      `#${slugify(audit.title)}-${slugify(pluginTitle)}`,
      audit.title,
    );
    return `${acc}  ${li(
      `${scoreMarker(audit.score, 'square')} ${auditTitle} - ${styleBold(
        audit,
      )}`,
    )}${NEW_LINE}`;
  }, '');

  return paragraphs(groupTitle, auditTitles);
}

export function auditDetailsAuditValue({
                                         score,
                                         value,
                                         displayValue,
                                       }: AuditReport) {
  return `${scoreMarker(score, 'square')} ${styleBold(
    {value, displayValue},
    true,
  )} (score: ${formatReportScore(score)})`;
}

export function generateMdReport(report: ScoredReport): string {
  const printCategories = report.categories?.length > 0;

  return paragraphs(
    // header section
    headline(reportHeadlineText),
    // categories overview section
    printCategories ? reportOverview(report) : '',
    // categories section
    printCategories ? categoriesDetails(report) : '',
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
        return {severity, message, file: '', line: ''} satisfies Partial<
          Record<ItemKeys, string>
        >;
      }
      // TODO: implement file links, ticket #149
      const file = `<code>${issue.source.file}</code>`;
      if (!issue.source.position) {
        return {severity, message, file, line: ''};
      }
      const {startLine, endLine} = issue.source.position;
      const line = `${startLine || ''}${
        endLine && startLine !== endLine ? `-${endLine}` : ''
      }`;
      return {severity, message, file, line};
    }),
  };

  return tableSection(detailsTableData, {heading: 'Issues'});
}

export function auditDetails(audit: AuditReport) {
  const detailsValue = auditDetailsAuditValue(audit);

  if (!audit.details) {
    return detailsValue;
  }

  const { table, issues } = audit.details;
  const tableSectionContent = table == null ? '' : tableSection(table);
  const issuesSection =
    issues == null || issues.length === 0 ? '' : auditDetailsIssues(issues);

  return details(detailsValue, `${tableSectionContent}${issuesSection}`);
}

// @TODO extract `Pick<AuditReport, 'docsUrl' | 'description'>` to a reusable schema and type
export function metaDescription({
                                  docsUrl,
                                  description,
                                }: Pick<AuditReport, 'docsUrl' | 'description'>): string {
  const endingNewLine = NEW_LINE + NEW_LINE;
  if (docsUrl) {
    const docsLink = link(docsUrl, '📖 Docs');
    if (!description) {
      return docsLink + endingNewLine;
    }
    // @TODO introduce NEW_LINE at the end of a code block
    if (description.endsWith('```')) {
      // when description ends in code block, link must be moved to next paragraph
      return description + NEW_LINE + NEW_LINE + docsLink + endingNewLine;
    }
    return `${description} ${docsLink}${endingNewLine}`;
  }
  if (description) {
    return description + endingNewLine;
  }
  return '';
}

export function auditsSection({plugins}: Pick<ScoredReport, 'plugins'>): string {
  const content = plugins.reduce((pluginAcc, {slug, title, audits}) => {
    const auditsData = audits.reduce((auditAcc, audit) => {
      const auditTitle = `${audit.title} (${getPluginNameFromSlug(
        slug,
        plugins,
      )})`;
      const detailsContent = auditDetails(audit);
      const descriptionContent = metaDescription(audit);
      return (
        auditAcc +
        h3(auditTitle) +
        NEW_LINE +
        NEW_LINE +
        detailsContent +
        NEW_LINE +
        NEW_LINE +
        descriptionContent
      );
    }, '');
    return pluginAcc + auditsData;
  }, '');

  return h2('🛡️ Audits') + NEW_LINE + NEW_LINE + content;
}

export function aboutSection(
  report: Omit<ScoredReport, 'packageName'>,
): string {
  const {
    date,
    plugins,
  } = report;

  const formattedDate = formatDate(new Date(date));
  const reportMetaTable = reportMetaData(report);

  const pluginMetaTable = reportPluginMeta({plugins});
  const level = 3;
  return paragraphs(
    h2('About'),
    `Report was created by [Code PushUp](${README_LINK}) on ${formattedDate}.`,
    tableSection(reportMetaTable, {heading: 'Report overview:', level}),
    tableSection(pluginMetaTable, {heading: 'Plugins overview:', level}),
  );
}

export function reportPluginMeta({plugins}: Pick<Report, 'plugins'>) {
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
    alignment: ['l', 'c', 'c', 'c'] as Alignment[],
  }
}

export function reportMetaData({commit, version, duration, plugins, categories}: Pick<
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
          .reduce((acc, {audits}) => acc + audits.length, 0)
          .toString(),
      },
    ],
    alignment: ['l', 'c', 'c', 'c', 'c', 'c'] as Alignment[],
  };
}

export function getAuditValue(audit: AuditReport, isHtml = false): string {
  const {displayValue, value} = audit;
  const text = displayValue || value.toString();
  return isHtml ? `<b>${text}</b>` : style(text);
}
