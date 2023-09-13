/**
 * \# {text} // hierarchy set to 1
 *
 * \## {text} // hierarchy set to 2
 */
export function link(text: string, href: string): string {
  return `[${text}](${href})`;
}
