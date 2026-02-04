export function normalizeItemOrArray<T>(itemOrArray: T | T[]): T[];
export function normalizeItemOrArray<T>(
  itemOrArray: T | T[] | undefined,
): T[] | undefined {
  if (itemOrArray == null) {
    return undefined;
  }
  if (Array.isArray(itemOrArray)) {
    return itemOrArray;
  }
  return [itemOrArray];
}
export function formatObjectToFormattedJsString(
  jsonObj?:
    | {
        [key: string]: unknown;
      }
    | unknown[],
): string | undefined {
  if (!jsonObj) {
    return;
  }
  const jsonString = JSON.stringify(jsonObj, null, 2);
  return jsonString.replace(/"(\w+)":/g, '$1:');
}
export function formatArrayToLinesOfJsString(
  lines?: string[],
  separator = '\n',
) {
  if (lines == null || lines.length === 0) {
    return;
  }
  return lines.join(separator).replace(/'/g, '"');
}
export function formatArrayToJSArray(lines?: string[]) {
  if (!Array.isArray(lines)) {
    return;
  }
  return `[${formatArrayToLinesOfJsString(lines, ',\n') ?? ''}]`.replace(
    /"/g,
    '',
  );
}
