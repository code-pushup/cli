/**
 * \# {text} // hierarchy set to 1
 *
 * \## {text} // hierarchy set to 2
 */
export function link(href: string, text?: string): string {
  return `[${text || href}](${href})`;
}
