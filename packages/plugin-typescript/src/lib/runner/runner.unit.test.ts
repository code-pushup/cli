import {
  type Diagnostic,
  DiagnosticCategory,
  type LineAndCharacter,
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
  const tSCodeToAuditSlugSpy = vi.spyOn(utilsModule, 'tSCodeToAuditSlug');
  const getIssueFromDiagnosticSpy = vi.spyOn(
    utilsModule,
    'getIssueFromDiagnostic',
  );
  const diagnosticCode = 7005;
  const mockDiagnostic = {
    code: diagnosticCode,
    start: () => void 0,
    messageText: `error text [${diagnosticCode}]`,
    category: DiagnosticCategory.Error,
    file: {
      getLineAndCharacterOfPosition: () =>
        ({ line: 1, character: 1 }) as LineAndCharacter,
      fileName: 'file-name.ts',
    } as unknown as SourceFile,
  } as unknown as Diagnostic;

  beforeEach(() => {
    getTypeScriptDiagnosticsSpy.mockReset();
  });

  it('should return empty array if no diagnostics are found', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([]);
    const runner = createRunnerFunction({
      tsConfigPath: 'tsconfig.json',
      expectedAudits: [],
    });
    await expect(runner(() => void 0)).resolves.toStrictEqual([]);
  });

  it('should return empty array if no supported diagnostics are found', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([mockDiagnostic]);
    const runner = createRunnerFunction({
      tsConfigPath: 'tsconfig.json',
      expectedAudits: [],
    });
    await expect(runner(() => void 0)).resolves.toStrictEqual([]);
  });

  it('should pass the diagnostic code to tsCodeToSlug', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([mockDiagnostic]);
    const runner = createRunnerFunction({
      tsConfigPath: 'tsconfig.json',
      expectedAudits: [],
    });
    await expect(runner(() => void 0)).resolves.toStrictEqual([]);
    expect(tSCodeToAuditSlugSpy).toHaveBeenCalledTimes(1);
    expect(tSCodeToAuditSlugSpy).toHaveBeenCalledWith(diagnosticCode);
  });

  it('should pass the diagnostic to getIssueFromDiagnostic', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([mockDiagnostic]);
    const runner = createRunnerFunction({
      tsConfigPath: 'tsconfig.json',
      expectedAudits: [],
    });
    await expect(runner(() => void 0)).resolves.toStrictEqual([]);
    expect(getIssueFromDiagnosticSpy).toHaveBeenCalledTimes(1);
    expect(getIssueFromDiagnosticSpy).toHaveBeenCalledWith(mockDiagnostic);
  });

  it('should return multiple issues per audit', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([
      { ...mockDiagnostic },
      {
        ...mockDiagnostic,
        code: 7006,
        messageText: `error text [7006]`,
      },
    ]);
    const runner = createRunnerFunction({
      tsConfigPath: 'tsconfig.json',
      expectedAudits: [{ slug: 'no-implicit-any' }],
    });

    const auditOutputs = await runner(() => void 0);
    expect(auditOutputs).toStrictEqual([
      {
        slug: 'no-implicit-any',
        score: 0,
        value: 2,
        details: {
          issues: [
            expect.objectContaining({ message: 'error text [7005]' }),
            expect.objectContaining({ message: 'error text [7006]' }),
          ],
        },
      },
    ]);
    expect(() => auditOutputsSchema.parse(auditOutputs)).not.toThrow();
  });

  it('should return multiple audits', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([
      { ...mockDiagnostic },
      {
        ...mockDiagnostic,
        // no-implicit-this
        code: 2683,
        messageText: `error text [2683]`,
      },
    ]);
    const runner = createRunnerFunction({
      tsConfigPath: 'tsconfig.json',
      expectedAudits: [
        { slug: 'no-implicit-any' },
        { slug: 'no-implicit-this' },
      ],
    });

    const auditOutputs = await runner(() => void 0);
    expect(auditOutputs).toStrictEqual([
      expect.objectContaining({
        slug: 'no-implicit-any',
        details: {
          issues: [expect.objectContaining({ message: 'error text [7005]' })],
        },
      }),
      expect.objectContaining({
        slug: 'no-implicit-this',
        details: {
          issues: [expect.objectContaining({ message: 'error text [2683]' })],
        },
      }),
    ]);
  });

  it('should return valid AuditOutput shape', async () => {
    getTypeScriptDiagnosticsSpy.mockResolvedValue([
      mockDiagnostic,
      { ...mockDiagnostic, code: 7006, messageText: `error text [7006]` },
      {
        ...mockDiagnostic,
        code: 2683,
        messageText: `error text [2683]`,
      },
    ]);
    const runner = createRunnerFunction({
      tsConfigPath: 'tsconfig.json',
      expectedAudits: [
        { slug: 'no-implicit-any' },
        { slug: 'no-implicit-this' },
      ],
    });
    const auditOutputs = await runner(() => void 0);
    expect(() => auditOutputsSchema.parse(auditOutputs)).not.toThrow();
  });
});
