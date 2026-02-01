import { type Diagnostic, DiagnosticCategory } from 'typescript';
import {
  getIssueFromDiagnostic,
  getSeverity,
  tsCodeToAuditSlug,
} from './utils.js';

describe('tSCodeToAuditSlug', () => {
  it('should transform supported code to readable audit', () => {
    expect(tsCodeToAuditSlug(Number.parseInt('2345', 10))).toBe(
      'semantic-errors',
    );
  });

  it('should return unknown slug for unknown code', () => {
    expect(tsCodeToAuditSlug(999)).toBe('unknown-codes');
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
      message: "TS222: Type 'number' is not assignable to type 'string'.",
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
        message: "TS222: Type 'number' is not assignable to type 'string'.",
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

  it('should replace absolute paths in message', () => {
    expect(
      getIssueFromDiagnostic({
        ...diagnosticMock,
        code: 6059,
        messageText: `File '${process.cwd()}/tools/publish.ts' is not under 'rootDir' 'src'. 'rootDir' is expected to contain all source files.`,
      }),
    ).toStrictEqual(
      expect.objectContaining({
        message: `TS6059: File './tools/publish.ts' is not under 'rootDir' 'src'. 'rootDir' is expected to contain all source files.`,
      }),
    );
  });

  it('should return issue without position if file is undefined', () => {
    expect(
      getIssueFromDiagnostic({ ...diagnosticMock, file: undefined }),
    ).toStrictEqual({
      message: "TS222: Type 'number' is not assignable to type 'string'.",
      severity: 'error',
    });
  });

  it('position.startLine should be 1 if start is undefined', () => {
    const result = getIssueFromDiagnostic({
      ...diagnosticMock,
      start: undefined,
    });
    expect(result.source?.position).toBeUndefined();
  });
});
