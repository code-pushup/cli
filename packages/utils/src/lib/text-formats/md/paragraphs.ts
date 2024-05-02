import { NEW_LINE } from '../constants';

export function paragraphs(
  ...sections: (string | undefined | boolean)[]
): string {
  return sections.filter(Boolean).join(`${NEW_LINE}${NEW_LINE}`);
}
