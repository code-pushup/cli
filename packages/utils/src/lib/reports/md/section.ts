import { NEW_LINE } from './constants';
import { paragraphs } from './paragraphs';

export function section(
  ...paragraphTexts: (string | undefined | boolean)[]
): string {
  return `${paragraphs(...paragraphTexts)}${NEW_LINE}`;
}
