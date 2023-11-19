export function filterKebabCaseKeys<T extends Record<string, unknown>>(
  obj: T,
): T {
  const newObj: Record<string, unknown> = {};

  Object.keys(obj).forEach(key => {
    if (key.includes('-')) {
      return;
    }
    newObj[key] = obj[key];
  });

  return newObj as T;
}
