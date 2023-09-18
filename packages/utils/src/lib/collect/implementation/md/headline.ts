export type Hierarchy = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * \# {text} // hierarchy set to 1
 *
 * \## {text} // hierarchy set to 2
 */
export function headline(text: string, hierarchy: Hierarchy = 1): string {
  return `${new Array(hierarchy).fill('#').join('')} ${text}`;
}
