export function link(href: string, text?: string): string {
  return `[${text || href}](${href})`;
}
