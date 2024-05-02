import type { FontStyleShortcuts } from '../types';

const stylesMap: Partial<Record<FontStyleShortcuts, string>> = {
  i: '_', // italic
  b: '**', // bold
  s: '~', // strike through
  c: '`', // code
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
  styles: FontStyleShortcuts[] = ['b'],
): string {
  return styles.reduce((t, s) => `${stylesMap[s]}${t}${stylesMap[s]}`, text);
}
