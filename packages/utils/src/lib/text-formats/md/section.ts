import { NEW_LINE } from '../constants';

export function section(...contents: (string | undefined | boolean)[]): string {
  return `${lines(...contents)}${NEW_LINE}`;
}

export function lines(
  ...contents: (string | undefined | boolean | number)[]
): string {
  const filteredContent = contents.filter(
    value => value != null && value !== '' && value !== false,
  );
  return `${filteredContent.join(NEW_LINE)}`;
}
