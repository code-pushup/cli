import {
  type Issue as KnipIssue,
  Issues as KnipIssues,
} from 'knip/dist/types/issues';
import { describe, expect, it } from 'vitest';
import { auditOutputsSchema } from '@code-pushup/models';
import { getPosition, knipToCpReport, toIssues } from './utils';

vi.mock('@code-pushup/utils', async () => {
  const actual = await vi.importActual('@code-pushup/utils');
  return {
    ...actual,
    getGitRoot: vi.fn().mockResolvedValue('User/projects/code-pushup-cli/'),
  };
});

describe('getPosition', () => {
  it('should return false if no positional information is given', () => {
    expect(getPosition({} as KnipIssue)).toBeFalsy();
  });

  it('should return a object containing file if filePath is given', () => {
    expect(getPosition({ col: 3, line: 2 } as KnipIssue)).toEqual({
      startColumn: 3,
      startLine: 2,
    });
  });
});

describe('toIssues', () => {
  it('should return empty issues if a given knip Issue set is empty', async () => {
    await expect(
      toIssues('files', {
        files: new Set<string>([]),
      } as KnipIssues),
    ).resolves.toStrictEqual([]);
  });

  it('should return empty issues if a given knip issue object is empty', async () => {
    await expect(
      toIssues('dependencies', {
        dependencies: {},
      } as KnipIssues),
    ).resolves.toStrictEqual([]);
  });

  it('should return issues with message', async () => {
    await expect(
      toIssues('files', {
        files: new Set<string>(['main.js']),
      } as KnipIssues),
    ).resolves.toStrictEqual([
      expect.objectContaining({
        message: 'Unused file main.js',
      }),
    ]);
  });

  it('should return message', async () => {
    await expect(
      toIssues('files', {
        files: new Set<string>(['main.js']),
      } as KnipIssues),
    ).resolves.toStrictEqual([
      expect.objectContaining({
        message: 'Unused file main.js',
      }),
    ]);
  });

  it('should return severity', async () => {
    await expect(
      toIssues('types', {
        types: {
          'logging.ts': {
            CliUi: {
              severity: 'error',
            },
          },
        },
      }),
    ).resolves.toStrictEqual([
      expect.objectContaining({
        severity: 'error',
      }),
    ]);
  });

  it('should return source with formatted file path', async () => {
    await expect(
      toIssues('files', {
        files: new Set<string>([
          'User/projects/code-pushup-cli/packages/utils/main.js',
        ]),
      } as KnipIssues),
    ).resolves.toStrictEqual([
      expect.objectContaining({
        source: {
          file: 'packages/utils/main.js',
        },
      }),
    ]);
  });

  it('should return source position', async () => {
    await expect(
      toIssues('types', {
        types: {
          'logging.ts': {
            CliUi: {
              type: 'types',
              filePath: 'logging.ts',
              symbol: 'CliUi',
              symbolType: 'type',
              pos: 124,
              line: 5,
              col: 13,
              severity: 'error',
            },
          },
        },
      }),
    ).resolves.toStrictEqual([
      expect.objectContaining({
        source: expect.objectContaining({
          position: {
            startColumn: 13,
            startLine: 5,
          },
        }),
      }),
    ]);
  });
});

describe('knipToCpReport', () => {
  it('should return empty audits if no report is flagged positive', async () => {
    await expect(
      knipToCpReport({
        report: {
          files: false,
          dependencies: false,
          // other options are falsy as undefined
        },
        issues: {},
      }),
    ).resolves.toStrictEqual([]);
  });

  it('should return only audits flagged in report object', async () => {
    await expect(
      knipToCpReport({
        report: {
          files: true,
          dependencies: true,
          // other options are falsy as undefined
        },
        issues: {
          files: new Set(),
          dependencies: {},
        },
      }),
    ).resolves.toStrictEqual(
      expect.arrayContaining([
        expect.objectContaining({ slug: 'unused-files' }),
        expect.objectContaining({ slug: 'unused-dependencies' }),
      ]),
    );
  });

  it('should have value as number of issues', async () => {
    await expect(
      knipToCpReport({
        report: { files: true },
        issues: { files: new Set(['a.js', 'b.js', 'c.js']) },
      }),
    ).resolves.toStrictEqual([expect.objectContaining({ value: 3 })]);
  });

  it('should have no display value', async () => {
    await expect(
      knipToCpReport({
        report: { files: true },
        issues: { files: new Set(['main.js']) },
      }),
    ).resolves.toStrictEqual([
      expect.not.objectContaining({ displayValue: expect.any(String) }),
    ]);
  });

  it('should score audits with empty issues with 1', async () => {
    await expect(
      knipToCpReport({
        report: { files: true },
        issues: { files: new Set() },
      }),
    ).resolves.toStrictEqual([expect.objectContaining({ score: 1 })]);
  });

  it('should score audits with issues with 0', async () => {
    await expect(
      knipToCpReport({
        report: { files: true },
        issues: { files: new Set(['main.js']) },
      }),
    ).resolves.toStrictEqual([expect.objectContaining({ score: 0 })]);
  });

  it('should return valid outputs schema', async () => {
    const result = await knipToCpReport({
      report: { files: true },
      issues: { files: new Set(['main.js']) },
    });
    expect(() => auditOutputsSchema.parse(result)).not.toThrow();
  });
});
