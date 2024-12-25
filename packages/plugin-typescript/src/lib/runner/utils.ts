import {
  type Diagnostic,
  DiagnosticCategory,
  flattenDiagnosticMessageText,
} from 'typescript';
import type { Issue } from '@code-pushup/models';
import type { AuditSlug } from '../types.js';
import { TS_ERROR_CODES } from './ts-error-codes.js';

// Build Reverse Lookup Map
export const AUDIT_LOOKUP = Object.values(TS_ERROR_CODES)
  .flatMap(v => Object.entries(v))
  .reduce<Map<number, AuditSlug>>((lookup, [slug, codes]) => {
    codes.forEach(code => lookup.set(code, slug as AuditSlug));
    return lookup;
  }, new Map<number, AuditSlug>());

export function transformTSErrorCodeToAuditSlug(code: number): AuditSlug {
  const knownCode = AUDIT_LOOKUP.get(code);
  if (knownCode === undefined) {
    throw new Error(`Code ${code} not supported.`);
  }
  return knownCode;
}

export function codeToAuditCodeSlug(tscode: number) {
  return `ts-code-${tscode.toString()}` as AuditSlug;
}

/**
 *  ts.DiagnosticCategory.Warning (1)
 *   ts.DiagnosticCategory.Error (2)
 *   ts.DiagnosticCategory.Suggestion (3)
 *   ts.DiagnosticCategory.Message (4)
 */
export function getSeverity(category: DiagnosticCategory): Issue['severity'] {
  switch (category) {
    case DiagnosticCategory.Error:
      return 'error';
    case DiagnosticCategory.Warning:
      return 'warning';
    // case DiagnosticCategory.Suggestion:
    // case DiagnosticCategory.Message:
    default:
      return 'info';
  }
}

export function getIssueFromDiagnostic(diag: Diagnostic): Issue {
  const message = `${flattenDiagnosticMessageText(diag.messageText, '\n')}`;
  const file = diag.file?.fileName;

  //   If undefined, the error might be global (e.g., invalid compiler option).
  if (file === undefined) {
    throw new Error(message);
  }

  const line =
    diag.file && diag.start !== undefined
      ? diag.file.getLineAndCharacterOfPosition(diag.start).line + 1
      : 0;

  return {
    severity: getSeverity(diag.category),
    message,
    source: {
      file,
      position: {
        startLine: line,
      },
    },
  };
}
