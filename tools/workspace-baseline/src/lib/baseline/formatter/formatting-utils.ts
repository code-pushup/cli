/**
 * Detects mutation objects that shouldn't be serialized in JSON output.
 * Mutation objects have a specific structure with 'kind', '__updater', and mutation methods.
 */
export function isMutationObject(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  // Check for mutation object structure: has 'kind' and '__updater'
  return (
    'kind' in obj &&
    '__updater' in obj &&
    (obj.kind === 'array' || obj.kind === 'object')
  );
}

/**
 * Sets a nested value in an object using a path array.
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown,
): void {
  let current = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    if (
      !(key in current) ||
      typeof current[key] !== 'object' ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  const lastKey = path[path.length - 1];
  if (lastKey !== undefined) {
    current[lastKey] = value;
  }
}

/**
 * Serializes a value to a string for comparison purposes.
 * Objects are serialized using JSON.stringify, primitives are converted to strings.
 */
export function serializeForComparison(value: unknown): string {
  if (value === null || value === undefined) {
    return String(value);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

const INDENT_SIZE = 2;

export function createIndent(level: number): string {
  return ' '.repeat(level * INDENT_SIZE);
}
