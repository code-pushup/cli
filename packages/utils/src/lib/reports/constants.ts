// https://stackoverflow.com/questions/4651012/why-is-the-default-terminal-width-80-characters/4651037#4651037
export const TERMINAL_WIDTH = 80;
export const NEW_LINE = '\n';

/* eslint-disable no-magic-numbers */
export const SCORE_COLOR_RANGE = {
  GREEN_MIN: 0.9,
  YELLOW_MIN: 0.5,
};
/* eslint-enable no-magic-numbers */

export const FOOTER_PREFIX = 'Made with ❤ by'; // replace ❤️ with ❤, because of ❤️ has output issues
export const CODE_PUSHUP_DOMAIN = 'code-pushup.dev';
export const README_LINK = 'https://github.com/code-pushup/cli#readme';
export const reportHeadlineText = 'Code PushUp Report';
export const reportOverviewTableHeaders = [
  '🏷 Category',
  '⭐ Score',
  '🛡 Audits',
];
export const reportRawOverviewTableHeaders = ['Category', 'Score', 'Audits'];
export const reportMetaTableHeaders: string[] = [
  'Commit',
  'Version',
  'Duration',
  'Plugins',
  'Categories',
  'Audits',
];

export const pluginMetaTableHeaders: string[] = [
  'Plugin',
  'Audits',
  'Version',
  'Duration',
];

// details headers

export const detailsTableHeaders: string[] = [
  'Severity',
  'Message',
  'Source file',
  'Line(s)',
];
