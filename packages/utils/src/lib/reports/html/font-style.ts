const stylesMap = {
  i: 'i', // italic
  b: 'b', // bold
  c: 'code', // code
} as const;

export type FontStyle = keyof typeof stylesMap;

/**
 * **{text}** // default is bold
 *
 * _{text}_ // italic - styles set to `['i']`
 *
 * ~**{text}**~ // bold & stroke-through - styles set to `['b','s']`
 */
export function style(text: string, styles: FontStyle[] = ['b']): string {
  return styles.reduce(
    (t, s) => `<${stylesMap[s]}>${t}</${stylesMap[s]}>`,
    text,
  );
}
