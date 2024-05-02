import { FONT_STYLES_SHORTS } from './constants';

export type FontStyleShortcuts =
  (typeof FONT_STYLES_SHORTS)[keyof typeof FONT_STYLES_SHORTS];
// eslint-disable-next-line no-magic-numbers
export type Hierarchy = 1 | 2 | 3 | 4 | 5 | 6;
export type Alignment = 'l' | 'c' | 'r';
