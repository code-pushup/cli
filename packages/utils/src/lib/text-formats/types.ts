import { FONT_STYLES } from './constants';

export type FontStyles = (typeof FONT_STYLES)[keyof typeof FONT_STYLES];
// eslint-disable-next-line no-magic-numbers
export type Hierarchy = 1 | 2 | 3 | 4 | 5 | 6;
