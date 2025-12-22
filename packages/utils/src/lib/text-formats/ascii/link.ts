import ansis from 'ansis';

export function formatAsciiLink(url: string): string {
  // no underline because terminals recognize URLs, and nested ansis styles aren't handled by wrap-ansi
  return ansis.blueBright(url);
}
