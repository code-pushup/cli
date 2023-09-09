const stylesMap = {
  i: '*', // italic
  b: '**', // bold
  s: '~', // strike through
} as const;

export type FontStyle = keyof typeof stylesMap;

/**
 * **{text}** // default is bold
 *
 * *{text}* // italic - styles set to `['i']`
 *
 * ~**{text}**~ // bold & stroke-through - styles set to `['b','s']`
 */
export function style(text: string, styles: FontStyle[] = ['b']): string {
  return styles.reduce((t, s) => `${stylesMap[s]}${t}${stylesMap[s]}`, text);
}
