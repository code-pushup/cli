import {
  type Diagnostic,
  DiagnosticCategory,
  flattenDiagnosticMessageText,
} from 'typescript';
import type { Issue } from '@code-pushup/models';
import { camelCaseToKebabCase, truncateIssueMessage } from '@code-pushup/utils';
import type { CompilerOptionName } from '../types.js';
import { TS_ERROR_CODES } from './ts-error-codes.js';

/** Build Reverse Lookup Map. It will a map with key as the error code and value as the audit slug. */
export const AUDIT_LOOKUP = Object.values(TS_ERROR_CODES)
  .flatMap(v => Object.entries(v))
  .reduce<Map<number, CompilerOptionName>>((lookup, [name, codes]) => {
    codes.forEach((code: number) =>
      lookup.set(code, camelCaseToKebabCase(name) as CompilerOptionName),
    );
    return lookup;
  }, new Map<number, CompilerOptionName>());

/**
 * Transform the TypeScript error code to the audit slug.
 * @param code - The TypeScript error code.
 * @returns The audit slug.
 * @throws Error if the code is not supported.
 */
export function tSCodeToAuditSlug(code: number): CompilerOptionName {
  const knownCode = AUDIT_LOOKUP.get(code);
  if (knownCode === undefined) {
    throw new Error(`Code ${code} not supported.`);
  }
  return knownCode;
}

//OK DOOONE, now it's more beautiful, goodbye! let me know when u finish if u want
// I was getting so frustrated of with webstorm sry xD
export function validateDiagnostics(diagnostics: readonly Diagnostic[]) {
  diagnostics
    .filter(({ code }) => !AUDIT_LOOKUP.has(code))
    .forEach(({ code, messageText }) => {
      console.warn(
        `Diagnostic Warning: The code ${code} is not supported. ${messageText}`,
      );
    });
}

/**
 * Get the severity of the issue based on the TypeScript diagnostic category.
 * - ts.DiagnosticCategory.Warning (1)
 * - ts.DiagnosticCategory.Error (2)
 * - ts.DiagnosticCategory.Suggestion (3)
 * - ts.DiagnosticCategory.Message (4)
 * @param category - The TypeScript diagnostic category.
 * @returns The severity of the issue.
 */
export function getSeverity(category: DiagnosticCategory): Issue['severity'] {
  switch (category) {
    case DiagnosticCategory.Error:
      return 'error';
    case DiagnosticCategory.Warning:
      return 'warning';
    default:
      return 'info';
  }
}

/**
 * Get the issue from the TypeScript diagnostic.
 * @param diag - The TypeScript diagnostic.
 * @returns The issue.
 * @throws Error if the diagnostic is global (e.g., invalid compiler option).
 */
export function getIssueFromDiagnostic(diag: Diagnostic) {
  const message = `${flattenDiagnosticMessageText(diag.messageText, '\n')}`;

  // If undefined, the error might be global (e.g., invalid compiler option).
  if (diag.file === undefined) {
    throw new Error(message);
  }

  const startLine =
    diag.start === undefined
      ? undefined
      : diag.file.getLineAndCharacterOfPosition(diag.start).line + 1;

  return {
    severity: getSeverity(diag.category),
    message: truncateIssueMessage(message),
    source: {
      file: diag.file.fileName,
      ...(startLine
        ? {
            position: {
              startLine,
            },
          }
        : {}),
    },
  } satisfies Issue;
}
