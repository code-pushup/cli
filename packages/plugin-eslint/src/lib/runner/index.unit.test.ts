import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { z } from 'zod';
import type {
  Audit,
  AuditOutput,
  pluginArtifactOptionsSchema,
} from '@code-pushup/models';
import { ui } from '@code-pushup/utils';
import type { ESLintTarget } from '../config.js';
import { generateAuditOutputs } from './index.js';
import * as lintModule from './lint.js';
import type { LinterOutput } from './types.js';
import * as utilsFileModule from './utils.js';

describe('generateAuditOutputs', () => {
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
      generateAuditOutputs({
        audits: mockAudits,
        targets: mockTargets,
        artifacts,
      }),
    ).resolves.toStrictEqual(mockedAuditOutputs);

    expect(loadArtifactsSpy).toHaveBeenCalledWith(artifacts);
    expect(lintSpy).not.toHaveBeenCalled();
    expect(ui()).toHaveLogged('log', 'ESLint plugin executing 2 lint targets');
  });

  it('should use internal linting logic when artifacts are not provided', async () => {
    lintSpy.mockResolvedValueOnce(mockLinterOutputs.at(0)!);
    lintSpy.mockResolvedValueOnce(mockLinterOutputs.at(0)!);

    await expect(
      generateAuditOutputs({
        audits: mockAudits,
        targets: mockTargets,
        outputDir: 'custom-output',
      }),
    ).resolves.toStrictEqual(mockedAuditOutputs);

    expect(loadArtifactsSpy).not.toHaveBeenCalled();
    expect(lintSpy).toHaveBeenCalledTimes(2);
  });
});
