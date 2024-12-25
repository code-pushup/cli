import { type Diagnostic, DiagnosticCategory } from 'typescript';
import { describe, expect } from 'vitest';
import {
  getIssueFromDiagnostic,
  getSeverity,
  transformTSErrorCodeToAuditSlug,
} from './utils.js';

describe('transformTSErrorCodeToAuditSlug', () => {
  it.each(Object.entries({}))(
    'should transform supported code to readable audit',
    (code, slug) => {
      expect(transformTSErrorCodeToAuditSlug(Number.parseInt(code, 10))).toBe(
        slug,
      );
    },
  );

  it('should throw error for unknown code', () => {
    expect(() => transformTSErrorCodeToAuditSlug(1111)).toThrow(
      'Code 1111 not supported.',
    );
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
    expect(getIssueFromDiagnostic(diagnosticMock)).toStrictEqual({
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
    expect(getIssueFromDiagnostic(diagnosticMock)).toStrictEqual(
      expect.objectContaining({
        message: "Type 'number' is not assignable to type 'string'.",
      }),
    );
  });

  it('should extract category and provide it under severity', () => {
    expect(getIssueFromDiagnostic(diagnosticMock)).toStrictEqual(
      expect.objectContaining({
        severity: 'error',
      }),
    );
  });

  it('should extract file path and provide it under source.file', () => {
    expect(getIssueFromDiagnostic(diagnosticMock)).toStrictEqual(
      expect.objectContaining({
        source: expect.objectContaining({ file: 'file.ts' }),
      }),
    );
  });

  it('should extract line and provide it under source.position', () => {
    expect(getIssueFromDiagnostic(diagnosticMock)).toStrictEqual(
      expect.objectContaining({
        source: expect.objectContaining({ position: { startLine: 100 } }),
      }),
    );
  });

  it('should throw error if file is undefined', () => {
    diagnosticMock.file = undefined;
    expect(() => getIssueFromDiagnostic(diagnosticMock)).toThrow(
      "Type 'number' is not assignable to type 'string'.",
    );
  });

  it('position.startLine should be 1 if start is undefined', () => {
    diagnosticMock.start = undefined;
    const result = getIssueFromDiagnostic(diagnosticMock);
    expect(result.source.position.startLine).toBe(1);
  });
});
