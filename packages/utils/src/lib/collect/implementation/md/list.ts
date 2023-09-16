export type Order = 'unordered' | 'checkbox';

/**
 * - {text}
 */
export function li(text: string, order: Order = 'unordered'): string {
  const style = order === 'unordered' ? '-' : '- [ ]';
  return `${style} ${text}`;
}
