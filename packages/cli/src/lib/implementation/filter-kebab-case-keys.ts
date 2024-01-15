export function filterKebabCaseKeys<T extends Record<string, unknown>>(
  obj: T,
): T {
  return Object.entries(obj)
    .filter(([key]) => !key.includes('-'))
    .reduce(
      (acc, [key, value]) =>
        typeof value === 'string' ||
        (typeof value === 'object' && Array.isArray(obj[key]))
          ? { ...acc, [key]: value }
          : typeof value === 'object' && !Array.isArray(value) && value != null
          ? {
              ...acc,
              [key]: filterKebabCaseKeys(value as Record<string, unknown>),
            }
          : { ...acc, [key]: value },
      {},
    ) as T;
}
