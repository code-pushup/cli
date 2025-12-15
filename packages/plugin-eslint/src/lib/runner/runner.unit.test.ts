import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';
import {
  type Audit,
  type AuditOutput,
  DEFAULT_PERSIST_CONFIG,
  type pluginArtifactOptionsSchema,
} from '@code-pushup/models';
import { logger } from '@code-pushup/utils';
import type { ESLintTarget } from '../config.js';
import * as lintModule from './lint.js';
import { createRunnerFunction } from './runner.js';
import type { LinterOutput } from './types.js';
import * as utilsFileModule from './utils.js';

describe('createRunnerFunction', () => {
  const loadArtifactsSpy = vi.spyOn(utilsFileModule, 'loadArtifacts');
  const lintSpy = vi.spyOn(lintModule, 'lint');

  const mockAudits: Audit[] = [
    { slug: 'max-lines', title: 'Max lines', description: 'Test' },
    { slug: 'no-unused-vars', title: 'No unused vars', description: 'Test' },
  ];
  const mockTargetPatterns = { patterns: ['src/**/*.ts'] };
  const mockTargetPatternsAndConfigs = {
    patterns: ['lib/**/*.js'],
    eslintrc: '.eslintrc.js',
  };
  const mockTargets: ESLintTarget[] = [
    mockTargetPatterns,
    mockTargetPatternsAndConfigs,
  ];

  const mockLinterOutputs: LinterOutput[] = [
    {
      results: [
        {
          filePath: 'test.ts',
          messages: [
            {
              ruleId: 'max-lines',
              severity: 1,
              message: 'File has too many lines',
              line: 1,
              column: 1,
            },
          ],
        } as any,
      ],
      ruleOptionsPerFile: { 'test.ts': { 'max-lines': [] } },
    },
    {
      results: [
        {
          filePath: 'test.ts',
          messages: [
            {
              ruleId: 'max-lines',
              severity: 1,
              message: 'File has too many lines',
              line: 1,
              column: 1,
            },
          ],
        } as any,
      ],
      ruleOptionsPerFile: { 'test.ts': { 'max-lines': [] } },
    },
  ];

  const mockedAuditOutputs: AuditOutput[] = [
    {
      slug: 'max-lines',
      score: 0,
      value: 2,
      displayValue: '2 warnings',
      details: {
        issues: [
          {
            message: 'File has too many lines',
            severity: 'warning',
            source: {
              file: 'test.ts',
              position: {
                startLine: 1,
                startColumn: 1,
              },
            },
          },
          {
            message: 'File has too many lines',
            severity: 'warning',
            source: {
              file: 'test.ts',
              position: {
                startLine: 1,
                startColumn: 1,
              },
            },
          },
        ],
      },
    },
    {
      slug: 'no-unused-vars',
      score: 1,
      value: 0,
      displayValue: 'passed',
      details: { issues: [] },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use loadArtifacts when artifacts are provided', async () => {
    const artifacts: z.infer<typeof pluginArtifactOptionsSchema> = {
      artifactsPaths: ['path/to/artifacts.json'],
    };
    loadArtifactsSpy.mockResolvedValue(mockLinterOutputs);

    await expect(
      createRunnerFunction({
        audits: mockAudits,
        targets: mockTargets,
        artifacts,
      })({ persist: DEFAULT_PERSIST_CONFIG }),
    ).resolves.toStrictEqual(mockedAuditOutputs);

    expect(loadArtifactsSpy).toHaveBeenCalledWith(artifacts);
    expect(lintSpy).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      'ESLint plugin executing 2 lint targets',
    );
  });

  it('should use internal linting logic when artifacts are not provided', async () => {
    lintSpy.mockResolvedValueOnce(mockLinterOutputs.at(0)!);
    lintSpy.mockResolvedValueOnce(mockLinterOutputs.at(0)!);

    await expect(
      createRunnerFunction({
        audits: mockAudits,
        targets: mockTargets,
      })({ persist: DEFAULT_PERSIST_CONFIG }),
    ).resolves.toStrictEqual(mockedAuditOutputs);

    expect(loadArtifactsSpy).not.toHaveBeenCalled();
    expect(lintSpy).toHaveBeenCalledTimes(2);
  });
});
