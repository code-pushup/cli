/* eslint-disable no-magic-numbers */
export type Hierarchy = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * \# {text} // hierarchy set to 1
 *
 * \## {text} // hierarchy set to 2
 */
export function headline(text: string, hierarchy: Hierarchy = 1): string {
  return `${'#'.repeat(hierarchy)} ${text}`;
}

export function h(text: string, hierarchy: Hierarchy = 1): string {
  return headline(text, hierarchy);
}

export function h1(text: string): string {
  return headline(text, 1);
}

export function h2(text: string): string {
  return headline(text, 2);
}

export function h3(text: string): string {
  return headline(text, 3);
}

export function h4(text: string): string {
  return headline(text, 4);
}

export function h5(text: string): string {
  return headline(text, 5);
}

export function h6(text: string): string {
  return headline(text, 6);
}
