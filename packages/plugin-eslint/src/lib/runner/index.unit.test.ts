import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PersistConfig } from '@code-pushup/models';
import * as utilsModule from '@code-pushup/utils';
import { createRunnerFunction } from './index.js';
import * as lintModule from './lint.js';
import * as transformModule from './transform.js';
import type { LinterOutput } from './types.js';
import * as utilsRunnerModule from './utils.js';

describe('createRunnerFunction', () => {
  const asyncSequentialSpy = vi.spyOn(utilsModule, 'asyncSequential');
  const uiLoggerLogSpy = vi.fn();
  vi.spyOn(utilsModule, 'ui').mockReturnValue({
    logger: {
      log: uiLoggerLogSpy,
      flushLogs: vi.fn(),
    },
    switchMode: vi.fn(),
  } as any);
  const lintSpy = vi.spyOn(lintModule, 'lint');
  const mergeLinterOutputsSpy = vi.spyOn(transformModule, 'mergeLinterOutputs');
  const lintResultsToAuditsSpy = vi.spyOn(
    transformModule,
    'lintResultsToAudits',
  );
  const loadArtifactsSpy = vi.spyOn(utilsRunnerModule, 'loadArtifacts');

  const mockLinterOutputs: LinterOutput[] = [
    {
      results: [],
      ruleOptionsPerFile: {},
    },
  ];

  const mockMergedOutput: LinterOutput = {
    results: [],
    ruleOptionsPerFile: {},
  };

  const mockFailedAudits = [
    {
      slug: 'no-unused-vars',
      score: 0,
      value: 1,
      displayValue: '1 error',
      details: { issues: [] },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    asyncSequentialSpy.mockResolvedValue(mockLinterOutputs);
    mergeLinterOutputsSpy.mockReturnValue(mockMergedOutput);
    lintResultsToAuditsSpy.mockReturnValue(mockFailedAudits);
    loadArtifactsSpy.mockResolvedValue(mockLinterOutputs);
  });

  it('should create a runner function and call dependencies', async () => {
    const runnerFunction = await createRunnerFunction({
      audits: [
        {
          slug: 'no-unused-vars',
          title: 'No unused vars',
          description: 'Test rule',
        },
      ],
      targets: [{ eslintrc: '.eslintrc.js', patterns: ['src/**/*.js'] }],
    });
    const persistConfig: PersistConfig = { outputDir: '/tmp/output' };
    await expect(runnerFunction(persistConfig)).resolves.not.toThrow();
    expect(uiLoggerLogSpy).toHaveBeenCalledWith(
      'ESLint plugin executing 1 lint targets',
    );
    expect(asyncSequentialSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          outputDir: '/tmp/output',
        }),
      ]),
      lintSpy,
    );
    expect(mergeLinterOutputsSpy).toHaveBeenCalledWith(mockLinterOutputs);
    expect(lintResultsToAuditsSpy).toHaveBeenCalledWith(mockMergedOutput);
  });

  it('should call loadArtifacts when artifacts provided', async () => {
    const runnerFunction = await createRunnerFunction({
      audits: [
        {
          slug: 'no-unused-vars',
          title: 'No unused vars',
          description: 'Test rule',
        },
      ],
      targets: [{ eslintrc: '.eslintrc.js', patterns: ['src/**/*.js'] }],
      artifacts: {
        artifactsPaths: ['/path/to/artifact.json'],
      },
    });
    const persistConfig: PersistConfig = { outputDir: '/tmp/output' };
    await expect(runnerFunction(persistConfig)).resolves.not.toThrow();

    expect(loadArtifactsSpy).toHaveBeenCalledWith({
      artifactsPaths: ['/path/to/artifact.json'],
    });
    expect(asyncSequentialSpy).not.toHaveBeenCalled();
    expect(mergeLinterOutputsSpy).toHaveBeenCalledWith(mockLinterOutputs);
    expect(lintResultsToAuditsSpy).toHaveBeenCalledWith(mockMergedOutput);
  });
});
