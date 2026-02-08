import type { Diagnostic } from '../baseline.json';
import { isMutationObject, setNestedValue } from './formatting-utils';

/**
 * Extracts the config path from a diagnostic path (removes project prefix if present).
 */
function extractConfigPath(path: string): string {
  const colonIndex = path.indexOf(':');
  return colonIndex === -1 ? path : path.slice(colonIndex + 1);
}

/**
 * Gets the value at a nested path in an object.
 */
function getNestedValue(
  obj: Record<string, unknown>,
  pathParts: string[],
): unknown {
  let current: unknown = obj;
  for (const part of pathParts) {
    if (
      current &&
      typeof current === 'object' &&
      part in (current as Record<string, unknown>)
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Groups diagnostics by their config path and merges array diagnostics.
 * Returns a map of config paths to merged diagnostics, and a structure object
 * containing the 'after' values from diagnostics.
 */
export function groupAndMergeDiagnostics(
  diagnostics: Diagnostic[],
  baselineValue?: Record<string, unknown>,
): {
  diagnosticsByPath: Map<string, Diagnostic>;
  structure: Record<string, unknown>;
} {
  const structure: Record<string, unknown> = {};
  const diagnosticsByPath = new Map<string, Diagnostic>();
  const diagnosticsByPathArray = new Map<string, Diagnostic[]>();

  // First pass: group diagnostics by path
  for (const diagnostic of diagnostics) {
    const configPath = extractConfigPath(diagnostic.path);
    if (!diagnosticsByPathArray.has(configPath)) {
      diagnosticsByPathArray.set(configPath, []);
    }
    diagnosticsByPathArray.get(configPath)!.push(diagnostic);
  }

  // Second pass: merge array diagnostics and create combined diagnostics
  for (const [configPath, pathDiagnostics] of diagnosticsByPathArray) {
    const pathParts = configPath.split('.');
    const baselineValueAtPath = baselineValue
      ? getNestedValue(baselineValue, pathParts)
      : undefined;
    const isArrayPath = Array.isArray(baselineValueAtPath);

    if (isArrayPath && pathDiagnostics.length > 1) {
      // Merge multiple array diagnostics into one
      const afterArray = Array.isArray(baselineValueAtPath)
        ? [...baselineValueAtPath]
        : [];

      // Reconstruct the original (before) array:
      // Start with the final array, remove items that were "added", add items that were "removed"
      const beforeArray = [...afterArray];

      // Remove items that were added (they weren't in the original)
      for (const d of pathDiagnostics) {
        if (d.message === 'added' && d.after !== undefined) {
          const serialized = JSON.stringify(d.after);
          const index = beforeArray.findIndex(
            item => JSON.stringify(item) === serialized,
          );
          if (index !== -1) {
            beforeArray.splice(index, 1);
          }
        }
      }

      // Add items that were removed (they were in the original)
      for (const d of pathDiagnostics) {
        if (d.message === 'removed' && d.before !== undefined) {
          const serialized = JSON.stringify(d.before);
          if (!beforeArray.some(item => JSON.stringify(item) === serialized)) {
            beforeArray.push(d.before);
          }
        }
      }

      // Create a combined diagnostic with full arrays
      const combinedDiagnostic: Diagnostic = {
        path: pathDiagnostics[0]!.path,
        message: 'updated',
        before: beforeArray.length > 0 ? beforeArray : undefined,
        after: afterArray.length > 0 ? afterArray : undefined,
      };

      diagnosticsByPath.set(configPath, combinedDiagnostic);

      // Set the merged array value in structure (use afterArray which is the baseline)
      if (afterArray.length > 0 && !isMutationObject(afterArray)) {
        setNestedValue(structure, pathParts, afterArray);
      }
    } else {
      // Single diagnostic or non-array path - use as-is
      const diagnostic = pathDiagnostics[0]!;
      diagnosticsByPath.set(configPath, diagnostic);

      // Only include fields that actually have changes
      // Skip if before and after are the same
      const hasChange =
        diagnostic.before === undefined ||
        diagnostic.after === undefined ||
        JSON.stringify(diagnostic.before) !== JSON.stringify(diagnostic.after);

      // Set the 'after' value in the structure (skip mutation objects)
      if (
        hasChange &&
        diagnostic.after !== undefined &&
        !isMutationObject(diagnostic.after)
      ) {
        setNestedValue(structure, pathParts, diagnostic.after);
      }
    }
  }

  return { diagnosticsByPath, structure };
}
