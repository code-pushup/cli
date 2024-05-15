// https://stackoverflow.com/questions/4651012/why-is-the-default-terminal-width-80-characters/4651037#4651037
import { TableColumnObject } from '@code-pushup/models';

export const TERMINAL_WIDTH = 80;

/* eslint-disable no-magic-numbers */
export const SCORE_COLOR_RANGE = {
  GREEN_MIN: 0.9,
  YELLOW_MIN: 0.5,
};
/* eslint-enable no-magic-numbers */

export const CATEGORIES_TITLE = '🏷 Categories';
export const FOOTER_PREFIX = 'Made with ❤ by'; // replace ❤️ with ❤, because ❤️ has output issues in terminal
export const CODE_PUSHUP_DOMAIN = 'code-pushup.dev';
export const README_LINK = 'https://github.com/code-pushup/cli#readme';
export const reportHeadlineText = 'Code PushUp Report';
export const reportOverviewTableHeaders = [
  {
    key: 'category',
    label: '🏷 Category',
    align: 'left',
  },
  {
    key: 'score',
    label: '⭐ Score',
  },
  {
    key: 'audits',
    label: '🛡 Audits',
  },
] as const satisfies TableColumnObject[];
export const reportRawOverviewTableHeaders = ['Category', 'Score', 'Audits'];

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
] as const satisfies TableColumnObject[];
