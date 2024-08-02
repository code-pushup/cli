import type { ExtractArrays } from '@code-pushup/utils';
import type { ExecutableCode } from './types';

export function normalizeExecutableCode(
  executableCode: ExecutableCode,
): ExtractArrays<ExecutableCode> {
  const { fileImports: rawFileImports, codeStrings: rawCodeStrings } =
    executableCode;

  return {
    fileImports: normalizeItemOrArray(rawFileImports) ?? [],
    codeStrings: normalizeItemOrArray(rawCodeStrings) ?? [],
  };
}

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

// Return a formatted JSON in TS object with the same keys as the input object but remove the " for the properties
export function formatObjectToFormattedJsString(
  jsonObj?:
    | {
        [key: string]: unknown;
      }
    | Array<unknown>,
): string | undefined {
  if (!jsonObj) {
    return;
  }
  // Convert JSON object to a string with indentation
  const jsonString = JSON.stringify(jsonObj, null, 2);

  // Remove double quotes around property names
  return jsonString.replace(/"(\w+)":/g, '$1:');
}

export function formatArrayToLinesOfJsString(
  lines?: string[],
  separator = '\n',
) {
  if (lines == null || lines.length === 0) {
    return;
  }
  return `${lines.join(separator).replace('"', '')}`;
}

export function formatArrayToJSArray(lines?: string[]) {
  if (lines == null) {
    return;
  }

  return `[${formatArrayToLinesOfJsString(lines, ',\n') ?? ''}]`;
}
