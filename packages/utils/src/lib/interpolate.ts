export function interpolate(
  text: string,
  variables: Record<string, string>,
): string {
  return Object.entries(variables).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
    text,
  );
}
