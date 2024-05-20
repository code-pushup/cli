import { FONT_STYLES } from '../constants';
import type { FontStyles } from '../types';

const stylesMap: Partial<Record<FontStyles, string>> = {
  italic: '_', // italic
  bold: '**', // bold
  'strike-through': '~', // strike through
  code: '`', // code
} as const;

/**
 * **{text}** // default is bold
 *
 * _{text}_ // italic - styles set to `['i']`
 *
 * ~**{text}**~ // bold & stroke-through - styles set to `['b','s']`
 */
export function style(
  text: string,
  styles: FontStyles[] = [FONT_STYLES.bold],
): string {
  return styles.reduce(
    (content, fontStyle) => `${stylesMap[fontStyle]}${content}${stylesMap[fontStyle]}`,
    text,
  );
}
