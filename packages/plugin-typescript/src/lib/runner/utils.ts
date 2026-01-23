import path from 'node:path';
import {
  type Diagnostic,
  DiagnosticCategory,
  flattenDiagnosticMessageText,
} from 'typescript';
import type { Issue } from '@code-pushup/models';
import { truncateIssueMessage } from '@code-pushup/utils';
import { TS_CODE_RANGE_NAMES } from './ts-error-codes.js';
import type { CodeRangeName } from './types.js';

/**
 * Transform the TypeScript error code to the audit slug.
 * @param code The TypeScript error code.
 * @returns The audit slug.
 * @throws Error if the code is not supported.
 */
export function tsCodeToAuditSlug(code: number): CodeRangeName {
  const rangeNumber = code
    .toString()
    .slice(0, 1) as keyof typeof TS_CODE_RANGE_NAMES;
  return TS_CODE_RANGE_NAMES[rangeNumber] ?? 'unknown-code';
}

/**
 * Get the severity of the issue based on the TypeScript diagnostic category.
 * - ts.DiagnosticCategory.Warning (1)
 * - ts.DiagnosticCategory.Error (2)
 * - ts.DiagnosticCategory.Suggestion (3)
 * - ts.DiagnosticCategory.Message (4)
 * @param category The TypeScript diagnostic category.
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
 * Format issue message from the TypeScript diagnostic.
 * @param diag The TypeScript diagnostic.
 * @returns The issue message.
 */
export function getMessage(diag: Diagnostic): string {
  const flattened = flattenDiagnosticMessageText(diag.messageText, '\n');
  const text = flattened
    .replace(process.cwd(), '.')
    .replace(process.cwd().replace(/\\/g, '/'), '.');
  return truncateIssueMessage(`TS${diag.code}: ${text}`);
}

/**
 * Get the issue from the TypeScript diagnostic.
 * @param diag The TypeScript diagnostic.
 * @returns The issue.
 * @throws Error if the diagnostic is global (e.g., invalid compiler option).
 */
export function getIssueFromDiagnostic(diag: Diagnostic) {
  const issue: Issue = {
    severity: getSeverity(diag.category),
    message: getMessage(diag),
  };

  // If undefined, the error might be global (e.g., invalid compiler option).
  if (diag.file === undefined) {
    return issue;
  }

  const startLine =
    diag.start === undefined
      ? undefined
      : diag.file.getLineAndCharacterOfPosition(diag.start).line + 1;

  return {
    ...issue,
    source: {
      file: path.relative(process.cwd(), diag.file.fileName),
      ...(startLine ? { position: { startLine } } : {}),
    },
  } satisfies Issue;
}
