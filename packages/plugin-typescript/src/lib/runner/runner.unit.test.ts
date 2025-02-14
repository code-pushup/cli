import {
  type Diagnostic,
  DiagnosticCategory,
  type SourceFile,
} from 'typescript';
import { beforeEach, describe, expect } from 'vitest';
import { auditOutputsSchema } from '@code-pushup/models';
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

  it('should return empty array if no diagnostics are found', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([]);
    const runner = createRunnerFunction({
      tsconfig: 'tsconfig.json',
      expectedAudits: [],
    });
    await expect(runner(() => void 0)).resolves.toStrictEqual([]);
  });

  it('should return empty array if no supported diagnostics are found', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([mockSemanticDiagnostic]);
    const runner = createRunnerFunction({
      tsconfig: 'tsconfig.json',
      expectedAudits: [],
    });
    await expect(runner(() => void 0)).resolves.toStrictEqual([]);
  });

  it('should pass the diagnostic code to tsCodeToSlug', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([mockSemanticDiagnostic]);
    const runner = createRunnerFunction({
      tsconfig: 'tsconfig.json',
      expectedAudits: [],
    });
    await expect(runner(() => void 0)).resolves.toStrictEqual([]);
    expect(tSCodeToAuditSlugSpy).toHaveBeenCalledTimes(1);
    expect(tSCodeToAuditSlugSpy).toHaveBeenCalledWith(semanticTsCode);
  });

  it('should pass the diagnostic to getIssueFromDiagnostic', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([mockSemanticDiagnostic]);
    const runner = createRunnerFunction({
      tsconfig: 'tsconfig.json',
      expectedAudits: [],
    });
    await expect(runner(() => void 0)).resolves.toStrictEqual([]);
    expect(getIssueFromDiagnosticSpy).toHaveBeenCalledTimes(1);
    expect(getIssueFromDiagnosticSpy).toHaveBeenCalledWith(
      mockSemanticDiagnostic,
    );
  });

  it('should return multiple issues per audit', async () => {
    const code = 2222;
    getTypeScriptDiagnosticsSpy.mockResolvedValue([
      mockSemanticDiagnostic,
      {
        ...mockSemanticDiagnostic,
        code,
        messageText: `error text [${code}]`,
      },
    ]);
    const runner = createRunnerFunction({
      tsconfig: 'tsconfig.json',
      expectedAudits: [{ slug: 'semantic-errors' }],
    });

    const auditOutputs = await runner(() => void 0);
    expect(auditOutputs).toStrictEqual([
      {
        slug: 'semantic-errors',
        score: 0,
        value: 2,
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

  it('should return multiple audits', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([
      mockSyntacticDiagnostic,
      mockSemanticDiagnostic,
    ]);
    const runner = createRunnerFunction({
      tsconfig: 'tsconfig.json',
      expectedAudits: [{ slug: 'semantic-errors' }, { slug: 'syntax-errors' }],
    });

    const auditOutputs = await runner(() => void 0);
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

  it('should return valid AuditOutput shape', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([
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
      tsconfig: 'tsconfig.json',
      expectedAudits: [{ slug: 'semantic-errors' }, { slug: 'syntax-errors' }],
    });
    const auditOutputs = await runner(() => void 0);
    expect(() => auditOutputsSchema.parse(auditOutputs)).not.toThrow();
  });
});
