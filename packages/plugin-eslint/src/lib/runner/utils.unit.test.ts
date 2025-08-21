import type { ESLint } from 'eslint';
import * as globModule from 'glob';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ui } from '@code-pushup/utils';
import * as utilsModule from '@code-pushup/utils';
import type { LinterOutput } from './types.js';
import { loadArtifacts } from './utils.js';

describe('loadArtifacts', () => {
  const globSpy = vi.spyOn(globModule, 'glob');
  const readJsonFileSpy = vi.spyOn(utilsModule, 'readJsonFile');
  const executeProcessSpy = vi.spyOn(utilsModule, 'executeProcess');

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

  const expectedLinterOutput1: LinterOutput = {
    results: mockRawResults1,
    ruleOptionsPerFile: {},
  };

  const expectedLinterOutput2: LinterOutput = {
    results: mockRawResults2,
    ruleOptionsPerFile: {},
  };

  const artifactsPaths = ['/path/to/artifact1.json', '/path/to/artifact2.json'];

  beforeEach(() => {
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
    globSpy.mockResolvedValue([artifactsPaths.at(0)!]);
    readJsonFileSpy.mockResolvedValue(mockRawResults1);

    await expect(
      loadArtifacts({ artifactsPaths: artifactsPaths.at(0)! }),
    ).resolves.toStrictEqual([expectedLinterOutput1]);
    expect(executeProcessSpy).not.toHaveBeenCalled();
    expect(readJsonFileSpy).toHaveBeenCalledTimes(1);
    expect(readJsonFileSpy).toHaveBeenNthCalledWith(1, artifactsPaths.at(0));

    expect(ui()).not.toHaveLogged('log', expect.stringMatching(/^\$ /));
  });

  it('should load multiple artifacts without generateArtifactsCommand', async () => {
    globSpy
      .mockResolvedValueOnce([artifactsPaths.at(0)!])
      .mockResolvedValueOnce([artifactsPaths.at(1)!]);
    readJsonFileSpy
      .mockResolvedValueOnce(mockRawResults1)
      .mockResolvedValueOnce(mockRawResults2);

    await expect(loadArtifacts({ artifactsPaths })).resolves.toStrictEqual([
      expectedLinterOutput1,
      expectedLinterOutput2,
    ]);

    expect(globSpy).toHaveBeenCalledTimes(2);
    expect(globSpy).toHaveBeenNthCalledWith(1, artifactsPaths.at(0));
    expect(globSpy).toHaveBeenNthCalledWith(2, artifactsPaths.at(1));
    expect(readJsonFileSpy).toHaveBeenCalledTimes(2);
    expect(readJsonFileSpy).toHaveBeenNthCalledWith(1, artifactsPaths.at(0));
    expect(readJsonFileSpy).toHaveBeenNthCalledWith(2, artifactsPaths.at(1));
    expect(executeProcessSpy).not.toHaveBeenCalled();
    expect(ui()).not.toHaveLogged('log', expect.stringMatching(/^\$ /));
  });

  it('should load artifacts with generateArtifactsCommand as string', async () => {
    globSpy
      .mockResolvedValueOnce([artifactsPaths.at(0)!])
      .mockResolvedValueOnce([artifactsPaths.at(1)!]);
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
    expect(globSpy).toHaveBeenCalledTimes(2);
    expect(ui()).toHaveLogged('log', `$ ${generateArtifactsCommand}`);
  });

  it('should load artifacts with generateArtifactsCommand as object', async () => {
    globSpy
      .mockResolvedValueOnce([artifactsPaths.at(0)!])
      .mockResolvedValueOnce([artifactsPaths.at(1)!]);
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
    expect(globSpy).toHaveBeenCalledTimes(2);
    expect(ui()).toHaveLogged(
      'log',
      '$ nx run-many -t lint --parallel --max-parallel=5',
    );
  });
});
