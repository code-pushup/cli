export type Order = 'unordered' | 'checkbox';

/**
 * \# {text} // hierarchy set to 1
 *
 * \## {text} // hierarchy set to 2
 */
export function li(text: string, order: Order = 'unordered'): string {
  const style = order === 'unordered' ? '-' : '- [ ]';
  return `${style}  ${text}`;
}
