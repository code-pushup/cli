import { HIERARCHY } from '../text-formats/index.js';

// https://stackoverflow.com/questions/4651012/why-is-the-default-terminal-width-80-characters/4651037#4651037
export const TERMINAL_WIDTH = 80;

export const SCORE_COLOR_RANGE = {
  /* eslint-disable @typescript-eslint/no-magic-numbers */
  GREEN_MIN: 0.9,
  YELLOW_MIN: 0.5,
  /* eslint-enable @typescript-eslint/no-magic-numbers */
};

export const FOOTER_PREFIX = 'Made with ❤ by'; // replace ❤️ with ❤, because ❤️ has output issues in terminal
export const CODE_PUSHUP_DOMAIN = 'code-pushup.dev';
export const README_LINK = 'https://github.com/code-pushup/cli#readme';
export const REPORT_HEADLINE_TEXT = 'Code PushUp Report';

export const CODE_PUSHUP_UNICODE_LOGO = '<✓>';

export const REPORT_RAW_OVERVIEW_TABLE_HEADERS = [
  'Category',
  'Score',
  'Audits',
];

export const AUDIT_DETAILS_HEADING_LEVEL = HIERARCHY.level_4;
