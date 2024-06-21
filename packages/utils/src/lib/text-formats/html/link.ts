export function link(href: string, text?: string): string {
  return `<a href="${href}">${text || href}</a>`;
}
