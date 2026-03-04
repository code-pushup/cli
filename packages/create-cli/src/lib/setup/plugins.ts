import type { PluginSetupBinding } from './types.js';

/** Parses a comma-separated string of plugin slugs into a deduplicated array. */
export function parsePluginSlugs(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    ),
  ];
}

/** Throws if any slug is not found in the available bindings. */
export function validatePluginSlugs(
  bindings: PluginSetupBinding[],
  plugins?: string[],
): void {
  if (plugins == null || plugins.length === 0) {
    return;
  }
  const unknown = plugins.filter(slug => !bindings.some(b => b.slug === slug));
  if (unknown.length > 0) {
    throw new TypeError(
      `Unknown plugin slugs: ${unknown.join(', ')}. Available: ${bindings.map(b => b.slug).join(', ')}`,
    );
  }
}
