export function paragraphs(
  ...sections: (string | undefined | boolean)[]
): string {
  return sections.filter(Boolean).join('\n\n');
}
