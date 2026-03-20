import type { PluginAnswer } from '@code-pushup/models';

/** Extracts a string value from a plugin answer, defaulting to `''`. */
export function answerString(
  answers: Record<string, PluginAnswer>,
  key: string,
): string {
  const value = answers[key];
  return typeof value === 'string' ? value : '';
}

/** Extracts a string array from a plugin answer, splitting CSV strings as fallback. */
export function answerArray(
  answers: Record<string, PluginAnswer>,
  key: string,
): string[] {
  const value = answers[key];
  if (Array.isArray(value)) {
    return value;
  }
  return (typeof value === 'string' ? value : '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/** Extracts a boolean from a plugin answer, defaulting to `true`. */
export function answerBoolean(
  answers: Record<string, PluginAnswer>,
  key: string,
): boolean {
  return answers[key] !== false;
}
