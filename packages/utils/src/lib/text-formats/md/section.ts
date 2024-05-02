import { NEW_LINE } from '../constants';

export function section(...contents: (string | undefined | boolean)[]): string {
  return `${lines(...contents)}${NEW_LINE}`;
}

export function lines(...contents: (string | undefined | boolean)[]): string {
  return `${contents.filter(Boolean).join(NEW_LINE)}`;
}
