import { FONT_STYLES } from '../constants';
import { FontStyles } from '../types';

const stylesMap: Partial<Record<FontStyles, string>> = {
  italic: 'i', // italic
  bold: 'b', // bold
  code: 'code', // code
} as const;

export function style(
  text: string,
  styles: Partial<FontStyles>[] = [FONT_STYLES.bold],
): string {
  return styles.reduce(
    (t, s) => `<${stylesMap[s]}>${t}</${stylesMap[s]}>`,
    text,
  );
}
