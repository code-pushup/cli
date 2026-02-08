import type { Diagnostic } from '../baseline.json';
import { groupAndMergeDiagnostics } from './diagnostic-grouper';
import {
  createIndent,
  isMutationObject,
  serializeForComparison,
} from './formatting-utils';
import type { ColorHelpers } from './theme';

function formatJsonScalar(
  key: string,
  value: unknown,
  diagnostic: Diagnostic,
  indentLevel: number,
  green: (v: string) => string,
  red: (v: string) => string,
): string[] {
  const indent = createIndent(indentLevel);
  const before = isMutationObject(diagnostic.before)
    ? undefined
    : diagnostic.before;
  const after = isMutationObject(diagnostic.after)
    ? undefined
    : diagnostic.after;

  if (before === after) {
    return [`${indent}"${key}": ${JSON.stringify(value)}`];
  }

  if (before === undefined) {
    const afterStr = JSON.stringify(after);
    return [`${indent}"${key}": ${green(afterStr)}`];
  }

  if (after === undefined) {
    const beforeStr = JSON.stringify(before);
    return [`${indent}"${key}": ${red(beforeStr)}`];
  }

  // Change case: before !== after
  const beforeStr = JSON.stringify(before);
  const afterStr = JSON.stringify(after);
  return [
    `${indent}"${key}":`,
    `${indent}  ${red('-')} ${red(beforeStr)}`,
    `${indent}  ${green('+')} ${green(afterStr)}`,
  ];
}

function formatJsonArray(
  arr: unknown[],
  diagnostic: Diagnostic | undefined,
  indentLevel: number,
  green: (v: string) => string,
  red: (v: string) => string,
  gray: (v: string) => string,
  showAllFields: boolean = false,
): string[] {
  const indent = createIndent(indentLevel);
  const lines: string[] = [];

  if (diagnostic) {
    const before = Array.isArray(diagnostic.before)
      ? diagnostic.before.filter(item => !isMutationObject(item))
      : [];
    const after = Array.isArray(diagnostic.after)
      ? diagnostic.after.filter(item => !isMutationObject(item))
      : [];
    const beforeSet = new Set(before.map(serializeForComparison));
    const afterSet = new Set(after.map(serializeForComparison));

    if (showAllFields) {
      // Show all items from the baseline array, marking which ones changed
      const sortedArray = [...arr].sort((a, b) =>
        serializeForComparison(a).localeCompare(serializeForComparison(b)),
      );

      for (let i = 0; i < sortedArray.length; i++) {
        const item = sortedArray[i];
        const isLast = i === sortedArray.length - 1;
        const serialized = serializeForComparison(item);
        const wasInBefore = beforeSet.has(serialized);
        const isInAfter = afterSet.has(serialized);

        if (!wasInBefore && isInAfter) {
          lines.push(
            `${indent}${green('+')} ${green(JSON.stringify(item))}${isLast ? '' : ','}`,
          );
        } else if (wasInBefore && !isInAfter) {
          lines.push(
            `${indent}${red('-')} ${red(JSON.stringify(item))}${isLast ? '' : ','}`,
          );
        } else {
          lines.push(
            `${indent}${gray(JSON.stringify(item))}${isLast ? '' : ','}`,
          );
        }
      }

      // Also show any items that were removed (in before but not in after/arr)
      const removedItems = before.filter(
        item => !afterSet.has(serializeForComparison(item)),
      );
      if (removedItems.length > 0) {
        removedItems.sort((a, b) =>
          serializeForComparison(a).localeCompare(serializeForComparison(b)),
        );
        for (const item of removedItems) {
          lines.push(`${indent}${red('-')} ${red(JSON.stringify(item))}`);
        }
      }
    } else {
      // Show only changes (removed and added items)
      const removedList = before.filter(
        item => !afterSet.has(serializeForComparison(item)),
      );
      removedList.sort((a, b) =>
        serializeForComparison(a).localeCompare(serializeForComparison(b)),
      );
      for (const item of removedList) {
        lines.push(`${indent}${red('-')} ${red(JSON.stringify(item))}`);
      }

      const addedList = after.filter(
        item => !beforeSet.has(serializeForComparison(item)),
      );
      addedList.sort((a, b) =>
        serializeForComparison(a).localeCompare(serializeForComparison(b)),
      );
      for (const item of addedList) {
        lines.push(`${indent}${green('+')} ${green(JSON.stringify(item))}`);
      }
    }
  } else {
    // No changes, show all items with commas (except last) - gray for unchanged
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      const isLast = i === arr.length - 1;
      lines.push(`${indent}${gray(JSON.stringify(item))}${isLast ? '' : ','}`);
    }
  }

  return lines;
}

function formatJsonObject(
  obj: Record<string, unknown>,
  diagnosticsByPath: Map<string, Diagnostic>,
  indentLevel: number,
  green: (v: string) => string,
  red: (v: string) => string,
  gray: (v: string) => string,
  parentPath: string = '',
  showAllFields: boolean = false,
): string[] {
  const indent = createIndent(indentLevel);
  const innerIndent = createIndent(indentLevel + 1);
  const lines: string[] = [];

  lines.push(`${indent}{`);

  // Filter to only show fields that have diagnostics (changes), or all fields if showAllFields is true
  const entries = Object.entries(obj).filter(([key, value]) => {
    if (isMutationObject(value)) return false;
    if (showAllFields) return true;
    const fullPath = parentPath ? `${parentPath}.${key}` : key;
    const diagnostic = diagnosticsByPath.get(fullPath);
    if (diagnostic) return true;
    // For nested objects, check if any child has a diagnostic
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedObj = value as Record<string, unknown>;
      const hasNestedChanges = Object.keys(nestedObj).some(nestedKey => {
        const nestedPath = `${fullPath}.${nestedKey}`;
        return diagnosticsByPath.has(nestedPath);
      });
      return hasNestedChanges;
    }
    return false;
  });

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;
    const [key, value] = entry;
    const isLast = i === entries.length - 1;
    const comma = isLast ? '' : ',';
    const fullPath = parentPath ? `${parentPath}.${key}` : key;

    const diagnostic = diagnosticsByPath.get(fullPath);
    const isUnchanged = !diagnostic && showAllFields;

    if (Array.isArray(value)) {
      if (diagnostic || showAllFields) {
        lines.push(
          `${innerIndent}${isUnchanged ? gray(`"${key}"`) : `"${key}"`}: [`,
        );
        const arrayLines = formatJsonArray(
          value,
          diagnostic,
          indentLevel + 2,
          green,
          red,
          gray,
          showAllFields,
        );
        lines.push(...arrayLines);
        lines.push(`${innerIndent}]${comma}`);
      }
    } else if (typeof value !== 'object' && value !== null) {
      if (diagnostic) {
        const scalarLines = formatJsonScalar(
          key,
          value,
          diagnostic,
          indentLevel + 1,
          green,
          red,
        );
        lines.push(...scalarLines);
        if (!isLast) {
          const lastLineIndex = scalarLines.length - 1;
          if (lastLineIndex >= 0) {
            lines[lines.length - 1] += ',';
          }
        }
      } else if (showAllFields) {
        lines.push(
          `${innerIndent}${gray(`"${key}"`)}: ${gray(JSON.stringify(value))}${comma}`,
        );
      }
    } else {
      if (
        typeof value === 'object' &&
        value !== null &&
        !isMutationObject(value) &&
        !Array.isArray(value)
      ) {
        const nested = formatJsonObject(
          value as Record<string, unknown>,
          diagnosticsByPath,
          indentLevel + 1,
          green,
          red,
          gray,
          fullPath,
          showAllFields,
        );
        if (nested.length > 2 || showAllFields) {
          lines.push(
            `${innerIndent}${isUnchanged ? gray(`"${key}"`) : `"${key}"`}: ${nested[0]}`,
          );
          lines.push(...nested.slice(1));
          lines[lines.length - 1] += comma;
        }
      }
    }
  }

  lines.push(`${indent}}`);
  return lines;
}

export function formatJsonWithDiffs(
  diagnostics: Diagnostic[],
  colorHelpers: ColorHelpers,
  baselineValue?: Record<string, unknown>,
): string[] {
  const { diagnosticsByPath, structure } = groupAndMergeDiagnostics(
    diagnostics,
    baselineValue,
  );

  // Always merge baselineValue with structure to show all baseline fields
  const finalStructure = baselineValue
    ? { ...baselineValue, ...structure }
    : structure;

  // Format the JSON structure with diffs
  const formatted = formatJsonObject(
    finalStructure,
    diagnosticsByPath,
    0,
    colorHelpers.green,
    colorHelpers.red,
    colorHelpers.gray,
    '',
    true, // Always show all fields
  );

  return formatted;
}
