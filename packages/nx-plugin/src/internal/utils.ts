export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+|\//g, '-')
    .replace(/[^a-z\d-]/g, '');
}
