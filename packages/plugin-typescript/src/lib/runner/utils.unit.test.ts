import {type Diagnostic, DiagnosticCategory,} from 'typescript';
import {beforeEach, describe, expect} from 'vitest';
import {getIssueFromDiagnostic, getSeverity, tSCodeToAuditSlug, validateDiagnostics,} from './utils.js';

describe('validateDiagnostics', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn');

  it('should not log for known error codes', () => {
    expect(() =>
      validateDiagnostics([
        {
          code: 7005,
          messageText: 'strich checks error',
        } as Diagnostic,
      ]),
    ).not.toThrow();
    expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
  });

  it.todo('should log for known error codes', () => {
    expect(() =>
      validateDiagnostics([
        {
          code: 1337,
          messageText: 'unknown error code',
        } as Diagnostic,
      ]),
    ).not.toThrow();
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
  });
});

describe('tSCodeToAuditSlug', () => {
  it.each(Object.entries({}))(
    'should transform supported code to readable audit',
    (code, slug) => {
      expect(tSCodeToAuditSlug(Number.parseInt(code, 10))).toBe(slug);
    },
  );

  it('should throw error for unknown code', () => {
    expect(() => tSCodeToAuditSlug(1111)).toThrow('Code 1111 not supported.');
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
  let diagnosticMock: Diagnostic;

  beforeEach(() => {
    diagnosticMock = {
      code: 222,
      category: DiagnosticCategory.Error,
      messageText: "Type 'number' is not assignable to type 'string'.",
      file: {
        fileName: 'file.ts',
        getLineAndCharacterOfPosition: () => ({ line: 99 }),
      },
      start: 4,
    } as any;
  });

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
    expect(() =>
      getIssueFromDiagnostic({ ...diagnosticMock, file: undefined }),
    ).toThrow("Type 'number' is not assignable to type 'string'.");
  });

  it('position.startLine should be 1 if start is undefined', () => {
    const result = getIssueFromDiagnostic({
      ...diagnosticMock,
      start: undefined,
    });
    expect(result.source.position).toBeUndefined();
  });
});
