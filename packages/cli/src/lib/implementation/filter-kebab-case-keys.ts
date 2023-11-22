export function filterKebabCaseKeys<T extends Record<string, unknown>>(
  obj: T,
): T {
  const newObj: Record<string, unknown> = {};

  Object.keys(obj).forEach(key => {
    if (key.includes('-')) {
      return;
    }

    if (
      typeof obj[key] === 'string' ||
      (typeof obj[key] === 'object' && Array.isArray(obj[key]))
    ) {
      newObj[key] = obj[key];
    }

    if (
      typeof obj[key] === 'object' &&
      !Array.isArray(obj[key]) &&
      obj[key] != null
    ) {
      newObj[key] = filterKebabCaseKeys(obj[key] as Record<string, unknown>);
    }
  });

  return newObj as T;
}
