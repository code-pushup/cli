import ansis from 'ansis';

export function formatAsciiLink(url: string): string {
  return ansis.underline.blueBright(url);
}
