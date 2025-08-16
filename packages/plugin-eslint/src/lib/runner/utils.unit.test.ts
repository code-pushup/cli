import type { ESLint } from 'eslint';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as utilsModule from '@code-pushup/utils';
import type { LinterOutput } from './types.js';
import { loadArtifacts } from './utils.js';

describe('loadArtifacts', () => {
  const readJsonFileSpy = vi.spyOn(utilsModule, 'readJsonFile');
  const executeProcessSpy = vi.spyOn(utilsModule, 'executeProcess');

  // Mock data should be raw ESLint.LintResult[] as that's what ESLint CLI outputs
  const mockRawResults1: ESLint.LintResult[] = [
    {
      filePath: '/test/file1.js',
      messages: [
        {
          ruleId: 'no-unused-vars',
          line: 1,
          column: 7,
          message: 'unused variable',
          severity: 2,
        },
      ],
      suppressedMessages: [],
      errorCount: 1,
      fatalErrorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      source: 'const unused = 1;',
      usedDeprecatedRules: [],
    },
  ];

  const mockRawResults2: ESLint.LintResult[] = [
    {
      filePath: '/test/file2.js',
      messages: [],
      suppressedMessages: [],
      errorCount: 0,
      fatalErrorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      source: 'const valid = 1; console.log(valid);',
      usedDeprecatedRules: [],
    },
  ];

  // Expected output after our function wraps raw results in LinterOutput format
  const expectedLinterOutput1: LinterOutput = {
    results: mockRawResults1,
    ruleOptionsPerFile: {},
  };

  const expectedLinterOutput2: LinterOutput = {
    results: mockRawResults2,
    ruleOptionsPerFile: {},
  };

  const artifactsPaths = ['/path/to/artifact1.json', '/path/to/artifact2.json'];

  beforeEach(async () => {
    vi.clearAllMocks();
    executeProcessSpy.mockResolvedValue({
      stdout: JSON.stringify(mockRawResults1),
      stderr: '',
      code: 0,
      date: new Date().toISOString(),
      duration: 0,
    });
  });

  it('should load single artifact without generateArtifactsCommand', async () => {
    readJsonFileSpy.mockResolvedValue(mockRawResults1);

    await expect(
      loadArtifacts({ artifactsPaths: artifactsPaths.at(0)! }),
    ).resolves.toStrictEqual([expectedLinterOutput1]);
    expect(executeProcessSpy).not.toHaveBeenCalled();
    expect(readJsonFileSpy).toHaveBeenCalledTimes(1);
    expect(readJsonFileSpy).toHaveBeenNthCalledWith(1, artifactsPaths.at(0));
  });

  it('should load multiple artifacts without generateArtifactsCommand', async () => {
    readJsonFileSpy
      .mockResolvedValueOnce(mockRawResults1)
      .mockResolvedValueOnce(mockRawResults2);

    await expect(loadArtifacts({ artifactsPaths })).resolves.toStrictEqual([
      expectedLinterOutput1,
      expectedLinterOutput2,
    ]);
    expect(executeProcessSpy).not.toHaveBeenCalled();
    expect(readJsonFileSpy).toHaveBeenCalledTimes(2);
    expect(readJsonFileSpy).toHaveBeenNthCalledWith(1, artifactsPaths.at(0));
    expect(readJsonFileSpy).toHaveBeenNthCalledWith(2, artifactsPaths.at(1));
  });

  it('should load artifacts with generateArtifactsCommand as string', async () => {
    readJsonFileSpy.mockResolvedValue([]);

    const generateArtifactsCommand = `nx run-many -t lint --parallel --max-parallel=5`;
    await expect(
      loadArtifacts({
        artifactsPaths,
        generateArtifactsCommand,
      }),
    ).resolves.not.toThrow();
    expect(executeProcessSpy).toHaveBeenCalledWith({
      args: [],
      command: generateArtifactsCommand,
      ignoreExitCode: true,
    });
  });

  it('should load artifacts with generateArtifactsCommand as object', async () => {
    readJsonFileSpy.mockResolvedValue([]);

    const generateArtifactsCommand = {
      command: 'nx',
      args: ['run-many', '-t', 'lint', '--parallel', '--max-parallel=5'],
    };
    await expect(
      loadArtifacts({
        artifactsPaths,
        generateArtifactsCommand,
      }),
    ).resolves.not.toThrow();
    expect(executeProcessSpy).toHaveBeenCalledWith({
      ...generateArtifactsCommand,
      ignoreExitCode: true,
    });
  });
});
