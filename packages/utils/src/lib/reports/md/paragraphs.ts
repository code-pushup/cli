import { NEW_LINE } from './constants';

export function paragraphs(
  ...sections: (string | undefined | boolean)[]
): string {
  return sections
    .filter(Boolean)
    .map(text =>
      text?.toString().endsWith('```') ? `${text}${NEW_LINE}` : text,
    )
    .join(NEW_LINE);
}
