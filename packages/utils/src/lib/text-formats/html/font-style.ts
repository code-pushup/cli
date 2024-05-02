import { FontStyleShortcuts } from '../types';

const stylesMap: Partial<Record<FontStyleShortcuts, string>> = {
  i: 'i', // italic
  b: 'b', // bold
  c: 'code', // code
} as const;

export function style(
  text: string,
  styles: Partial<FontStyleShortcuts>[] = ['b'],
): string {
  return styles.reduce(
    (t, s) => `<${stylesMap[s]}>${t}</${stylesMap[s]}>`,
    text,
  );
}
