import { TAB } from '../constants';

export type Order = 'unordered' | 'checkbox';

/**
 * - {text}
 */
export function li(text: string, order: Order = 'unordered'): string {
  const style = order === 'unordered' ? '-' : '- [ ]';
  return `${style} ${text}`;
}

// eslint-disable-next-line no-magic-numbers
export type Indentations = 1 | 2 | 3;
export function indentation(text: string, level: Indentations = 1) {
  return `${TAB.repeat(level)}${text}`;
}
