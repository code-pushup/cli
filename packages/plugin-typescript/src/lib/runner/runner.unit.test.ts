import {
  type Diagnostic,
  DiagnosticCategory,
  type SourceFile,
} from 'typescript';
import { beforeEach, describe, expect } from 'vitest';
import {
  DEFAULT_PERSIST_CONFIG,
  type RunnerArgs,
  auditOutputsSchema,
} from '@code-pushup/models';
import { createRunnerFunction } from './runner.js';
import * as runnerModule from './ts-runner.js';
import * as utilsModule from './utils.js';

describe('createRunnerFunction', () => {
  const getTypeScriptDiagnosticsSpy = vi.spyOn(
    runnerModule,
    'getTypeScriptDiagnostics',
  );
  const tSCodeToAuditSlugSpy = vi.spyOn(utilsModule, 'tsCodeToAuditSlug');
  const getIssueFromDiagnosticSpy = vi.spyOn(
    utilsModule,
    'getIssueFromDiagnostic',
  );

  const runnerArgs: RunnerArgs = { persist: DEFAULT_PERSIST_CONFIG };

  const semanticTsCode = 2322;
  const mockSemanticDiagnostic = {
    code: semanticTsCode, // "Type 'string' is not assignable to type 'number'"
    start: 10, // Mocked character position
    messageText: "Type 'string' is not assignable to type 'number'.",
    category: DiagnosticCategory.Error,
    file: {
      getLineAndCharacterOfPosition: () => ({ line: 5, character: 10 }),
      fileName: 'example.ts',
    } as unknown as SourceFile,
  } as unknown as Diagnostic;
  const syntacticTsCode = 1005;
  const mockSyntacticDiagnostic = {
    code: syntacticTsCode, // "';' expected."
    start: 25, // Mocked character position
    messageText: "';' expected.",
    category: DiagnosticCategory.Error,
    file: {
      getLineAndCharacterOfPosition: () => ({ line: 10, character: 20 }),
      fileName: 'example.ts',
    } as unknown as SourceFile,
  } as unknown as Diagnostic;

  beforeEach(() => {
    getTypeScriptDiagnosticsSpy.mockReset();
  });

  it('should return empty array if no diagnostics are found', () => {
    getTypeScriptDiagnosticsSpy.mockReturnValue([]);
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.json'],
      expectedAudits: [],
    });
    expect(runner(runnerArgs)).toStrictEqual([]);
  });

  it('should return empty array if no supported diagnostics are found', () => {
    getTypeScriptDiagnosticsSpy.mockReturnValue([mockSemanticDiagnostic]);
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.json'],
      expectedAudits: [],
    });
    expect(runner(runnerArgs)).toStrictEqual([]);
  });

  it('should pass the diagnostic code to tsCodeToSlug', () => {
    getTypeScriptDiagnosticsSpy.mockReturnValue([mockSemanticDiagnostic]);
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.json'],
      expectedAudits: [],
    });
    expect(runner(runnerArgs)).toStrictEqual([]);
    expect(tSCodeToAuditSlugSpy).toHaveBeenCalledTimes(1);
    expect(tSCodeToAuditSlugSpy).toHaveBeenCalledWith(semanticTsCode);
  });

  it('should pass the diagnostic to getIssueFromDiagnostic', () => {
    getTypeScriptDiagnosticsSpy.mockReturnValue([mockSemanticDiagnostic]);
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.json'],
      expectedAudits: [],
    });
    expect(runner(runnerArgs)).toStrictEqual([]);
    expect(getIssueFromDiagnosticSpy).toHaveBeenCalledTimes(1);
    expect(getIssueFromDiagnosticSpy).toHaveBeenCalledWith(
      mockSemanticDiagnostic,
    );
  });

  it('should return multiple issues per audit', () => {
    const code = 2222;
    getTypeScriptDiagnosticsSpy.mockReturnValue([
      mockSemanticDiagnostic,
      {
        ...mockSemanticDiagnostic,
        code,
        messageText: `error text [${code}]`,
      },
    ]);
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.json'],
      expectedAudits: [{ slug: 'semantic-errors' }],
    });

    const auditOutputs = runner(runnerArgs);
    expect(auditOutputs).toStrictEqual([
      {
        slug: 'semantic-errors',
        score: 0,
        value: 2,
        displayValue: '2 errors',
        details: {
          issues: [
            expect.objectContaining({
              message: `TS${mockSemanticDiagnostic.code}: ${mockSemanticDiagnostic.messageText}`,
            }),
            expect.objectContaining({
              message: `TS${code}: error text [${code}]`,
            }),
          ],
        },
      },
    ]);
    expect(() => auditOutputsSchema.parse(auditOutputs)).not.toThrow();
  });

  it('should return multiple audits', () => {
    getTypeScriptDiagnosticsSpy.mockReturnValue([
      mockSyntacticDiagnostic,
      mockSemanticDiagnostic,
    ]);
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.json'],
      expectedAudits: [{ slug: 'semantic-errors' }, { slug: 'syntax-errors' }],
    });

    const auditOutputs = runner(runnerArgs);
    expect(auditOutputs).toStrictEqual([
      expect.objectContaining({
        slug: 'semantic-errors',
        details: {
          issues: [
            expect.objectContaining({
              message: `TS2322: Type 'string' is not assignable to type 'number'.`,
            }),
          ],
        },
      }),
      expect.objectContaining({
        slug: 'syntax-errors',
        details: {
          issues: [
            expect.objectContaining({ message: "TS1005: ';' expected." }),
          ],
        },
      }),
    ]);
  });

  it('should return valid AuditOutput shape', () => {
    getTypeScriptDiagnosticsSpy.mockReturnValue([
      mockSyntacticDiagnostic,
      {
        ...mockSyntacticDiagnostic,
        code: 2222,
        messageText: `error text [2222]`,
      },
      mockSemanticDiagnostic,
      {
        ...mockSemanticDiagnostic,
        code: 1111,
        messageText: `error text [1111]`,
      },
    ]);
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.json'],
      expectedAudits: [{ slug: 'semantic-errors' }, { slug: 'syntax-errors' }],
    });
    const auditOutputs = runner(runnerArgs);
    expect(() => auditOutputsSchema.parse(auditOutputs)).not.toThrow();
  });

  it('should aggregate diagnostics from multiple tsconfigs', () => {
    getTypeScriptDiagnosticsSpy
      .mockReturnValueOnce([mockSemanticDiagnostic])
      .mockReturnValueOnce([mockSyntacticDiagnostic]);

    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.lib.json', 'tsconfig.spec.json'],
      expectedAudits: [{ slug: 'semantic-errors' }, { slug: 'syntax-errors' }],
    });

    const auditOutputs = runner(runnerArgs);

    expect(getTypeScriptDiagnosticsSpy).toHaveBeenCalledTimes(2);
    expect(getTypeScriptDiagnosticsSpy).toHaveBeenNthCalledWith(1, {
      tsconfig: 'tsconfig.lib.json',
    });
    expect(getTypeScriptDiagnosticsSpy).toHaveBeenNthCalledWith(2, {
      tsconfig: 'tsconfig.spec.json',
    });

    expect(auditOutputs).toStrictEqual([
      expect.objectContaining({
        slug: 'semantic-errors',
        value: 1,
        details: {
          issues: [
            expect.objectContaining({
              message: `TS2322: Type 'string' is not assignable to type 'number'.`,
            }),
          ],
        },
      }),
      expect.objectContaining({
        slug: 'syntax-errors',
        value: 1,
        details: {
          issues: [
            expect.objectContaining({ message: "TS1005: ';' expected." }),
          ],
        },
      }),
    ]);
  });

  it('should skip failed tsconfigs and warn when multiple configs provided', () => {
    getTypeScriptDiagnosticsSpy
      .mockReturnValueOnce([mockSemanticDiagnostic])
      .mockImplementationOnce(() => {
        throw new Error('File not found');
      });
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.lib.json', 'tsconfig.broken.json'],
      expectedAudits: [{ slug: 'semantic-errors' }],
    });
    const auditOutputs = runner(runnerArgs);
    expect(auditOutputs).toStrictEqual([
      expect.objectContaining({
        slug: 'semantic-errors',
        value: 1,
      }),
    ]);
  });

  it('should throw if single tsconfig fails', () => {
    getTypeScriptDiagnosticsSpy.mockImplementation(() => {
      throw new Error('File not found');
    });
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.json'],
      expectedAudits: [],
    });
    expect(() => runner(runnerArgs)).toThrow('File not found');
  });

  it('should throw if all tsconfigs fail', () => {
    getTypeScriptDiagnosticsSpy.mockImplementation(() => {
      throw new Error('Error');
    });
    const runner = createRunnerFunction({
      tsconfig: ['tsconfig.a.json', 'tsconfig.b.json'],
      expectedAudits: [],
    });
    expect(() => runner(runnerArgs)).toThrow(
      'All 2 TypeScript configurations failed to load',
    );
  });
});
