import picomatch from 'picomatch';

export function pluralize(text: string, count: number): string {
  return count === 1 ? text : `${text}s`;
}

export function createPatternMatcher(
  patterns: readonly string[],
): (value: string) => boolean {
  return picomatch(patterns.map(pattern => pattern.toString()));
}

export function pluralizeToken(token: string, times: number): string {
  return `${times} ${pluralize(token, times)}`;
}
