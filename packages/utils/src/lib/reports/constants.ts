// https://stackoverflow.com/questions/4651012/why-is-the-default-terminal-width-80-characters/4651037#4651037
import { TableHeading } from '@code-pushup/models';

export const TERMINAL_WIDTH = 80;
export const NEW_LINE = '\n';

/* eslint-disable no-magic-numbers */
export const SCORE_COLOR_RANGE = {
  GREEN_MIN: 0.9,
  YELLOW_MIN: 0.5,
};
/* eslint-enable no-magic-numbers */

export const CATEGORIES_TITLE = '🏷 Categories';
export const FOOTER_PREFIX = 'Made with ❤ by'; // replace ❤️ with ❤, because of ❤️ has output issues
export const CODE_PUSHUP_DOMAIN = 'code-pushup.dev';
export const README_LINK = 'https://github.com/code-pushup/cli#readme';
export const reportHeadlineText = 'Code PushUp Report';
export const reportOverviewTableHeaders = [
  {
    key: 'category',
    label: '🏷 Category',
    align: 'l',
  },
  {
    key: 'score',
    label: '⭐ Score',
    align: 'c',
  },
  {
    key: 'audits',
    label: '🛡 Audits',
    align: 'c',
  },
] as const satisfies TableHeading[];
export const reportRawOverviewTableHeaders = ['Category', 'Score', 'Audits'];
export const reportMetaTableHeaders = [
  {
    key: 'commit',
    label: 'Commit',
    align: 'l',
  },
  {
    key: 'version',
    label: 'Version',
    align: 'c',
  },
  {
    key: 'duration',
    label: 'Duration',
    align: 'c',
  },
  {
    key: 'plugins',
    label: 'Plugins',
    align: 'c',
  },
  {
    key: 'categories',
    label: 'Categories',
    align: 'c',
  },
  {
    key: 'audits',
    label: 'Audits',
    align: 'c',
  },
] as const satisfies TableHeading[];

export const pluginMetaTableHeaders = [
  {
    key: 'plugin',
    label: 'Plugin',
    align: 'l',
  },
  {
    key: 'audits',
    label: 'Audits',
    align: 'c',
  },
  {
    key: 'version',
    label: 'Version',
    align: 'c',
  },
  {
    key: 'duration',
    label: 'Duration',
    align: 'c',
  },
] as const satisfies TableHeading[];

// details headers

export const issuesTableHeadings = [
  {
    key: 'severity',
    label: 'Severity',
  },
  {
    key: 'message',
    label: 'Message',
  },
  {
    key: 'file',
    label: 'Source file',
  },
  {
    key: 'line',
    label: 'Line(s)',
  },
] as const satisfies TableHeading[];
