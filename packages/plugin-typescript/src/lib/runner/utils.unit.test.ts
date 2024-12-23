import { DiagnosticCategory } from 'typescript';
import { describe, expect } from 'vitest';
import { SUPPORTED_TS_ERROR_CODES } from '../constants.js';
import {
  codeToAuditSlug,
  getIssueFromDiagnostic,
  getSeverity,
  transformTSErrorCodeToAuditSlug,
} from './utils.js';

describe('transformTSErrorCodeToAuditSlug', () => {
  it.each(Object.entries(SUPPORTED_TS_ERROR_CODES))(
    'should transform supported code to readable audit',
    (code, slug) => {
      expect(transformTSErrorCodeToAuditSlug(Number.parseInt(code, 10))).toBe(
        slug,
      );
    },
  );

  it('should transform unsupported code to ts-code audit', () => {
    expect(transformTSErrorCodeToAuditSlug(1111)).toBe('ts-code-1111');
  });
});

describe('codeToAuditSlug', () => {
  it('should prodice ts-code audit', () => {
    expect(codeToAuditSlug(123)).toBe('ts-code-123');
  });
});

describe('getSeverity', () => {
  it.each([
    [DiagnosticCategory.Error, 'error' as const],
    [DiagnosticCategory.Warning, 'warning' as const],
    [DiagnosticCategory.Message, 'info' as const],
    [DiagnosticCategory.Suggestion, 'info' as const],
  ])('should return "error" for DiagnosticCategory.Error', (cat, severity) => {
    expect(getSeverity(cat)).toBe(severity);
  });

  it('should return "info" for unknown category', () => {
    expect(getSeverity(999 as DiagnosticCategory)).toBe('info');
  });
});

describe('getIssueFromDiagnostic', () => {
  const diagnositcMock = {
    code: 222,
    category: DiagnosticCategory.Error,
    messageText: "Type 'number' is not assignable to type 'string'.",
    file: {
      fileName: 'file.ts',
      getLineAndCharacterOfPosition: () => ({ line: 99 }),
    },
    start: 4,
  } as any;

  it('should return valid issue', () => {
    expect(getIssueFromDiagnostic(diagnositcMock)).toStrictEqual({
      message: "Type 'number' is not assignable to type 'string'.",
      severity: 'error',
      source: {
        file: 'file.ts',
        position: {
          startLine: 100,
        },
      },
    });
  });

  it('should extract messageText and provide it under message', () => {
    expect(getIssueFromDiagnostic(diagnositcMock)).toStrictEqual(
      expect.objectContaining({
        message: "Type 'number' is not assignable to type 'string'.",
      }),
    );
  });

  it('should extract category and provide it under severity', () => {
    expect(getIssueFromDiagnostic(diagnositcMock)).toStrictEqual(
      expect.objectContaining({
        severity: 'error',
      }),
    );
  });

  it('should extract file path and provide it under source.file', () => {
    expect(getIssueFromDiagnostic(diagnositcMock)).toStrictEqual(
      expect.objectContaining({
        source: expect.objectContaining({ file: 'file.ts' }),
      }),
    );
  });

  it('should extract line and provide it under source.position', () => {
    expect(getIssueFromDiagnostic(diagnositcMock)).toStrictEqual(
      expect.objectContaining({
        source: expect.objectContaining({ position: { startLine: 100 } }),
      }),
    );
  });
});
