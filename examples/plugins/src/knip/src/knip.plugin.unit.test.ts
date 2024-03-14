import { ReporterOptions, SymbolType } from 'knip/dist/types/issues';
import { describe, expect, it } from 'vitest';
import { auditOutputsSchema } from '@code-pushup/models';
import rawKnipReport from '../../../mocks/knip-raw';
import {
  createAuditOutputFromKnipFiles,
  createAuditOutputFromKnipIssues,
  knipToCpReport,
} from './utils';

describe('knipToCpReport', () => {
  it('should return correct audit and issues for dependencies', () => {
    expect(() =>
      auditOutputsSchema.parse(
        knipToCpReport(rawKnipReport as Pick<ReporterOptions, 'issues'>),
      ),
    ).not.toThrow();
  });
});

describe('createAuditOutputFromKnipFiles', () => {
  it('should return correct audit and issues for files', () => {
    expect(createAuditOutputFromKnipFiles(['/package.json'])).toEqual({
      slug: 'files',
      value: 1,
      displayValue: '1 file',
      score: 0,
      details: {
        issues: [
          {
            message: 'File /package.json unused',
            severity: 'error',
            source: {
              file: '/package.json',
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for dependencies', () => {
    expect(
      createAuditOutputFromKnipIssues('dependencies', [
        {
          type: 'dependencies',
          filePath: '/package.json',
          symbol: '@trivago/prettier-plugin-sort-imports',
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'dependencies',
      value: 1,
      displayValue: '1 dependency',
      score: 0,
      details: {
        issues: [
          {
            message: 'Dependency @trivago/prettier-plugin-sort-imports unused',
            severity: 'error',
            source: {
              file: '/package.json',
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for devDependencies', () => {
    expect(
      createAuditOutputFromKnipIssues('devDependencies', [
        {
          type: 'devDependencies',
          filePath: '/package.json',
          symbol: '@trivago/prettier-plugin-sort-imports',
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'devdependencies',
      value: 1,
      displayValue: '1 devDependency',
      score: 0,
      details: {
        issues: [
          {
            message:
              'DevDependency @trivago/prettier-plugin-sort-imports unused',
            severity: 'error',
            source: {
              file: '/package.json',
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for optionalPeerDependencies', () => {
    expect(
      createAuditOutputFromKnipIssues('optionalPeerDependencies', [
        {
          type: 'optionalPeerDependencies',
          filePath: '/package.json',
          symbol: '@trivago/prettier-plugin-sort-imports',
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'optionalpeerdependencies',
      value: 1,
      displayValue: '1 optionalPeerDependency',
      score: 0,
      details: {
        issues: [
          {
            message:
              'OptionalPeerDependency @trivago/prettier-plugin-sort-imports unused',
            severity: 'error',
            source: {
              file: '/package.json',
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for unlisted', () => {
    expect(
      createAuditOutputFromKnipIssues('unlisted', [
        {
          type: 'unlisted',
          filePath: '/package.json',
          symbol: '@trivago/prettier-plugin-sort-imports',
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'unlisted',
      value: 1,
      displayValue: '1 unlisted',
      score: 0,
      details: {
        issues: [
          {
            message: 'Unlisted @trivago/prettier-plugin-sort-imports unused',
            severity: 'error',
            source: {
              file: '/package.json',
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for binaries', () => {
    expect(
      createAuditOutputFromKnipIssues('binaries', [
        {
          type: 'binaries',
          filePath: '/package.json',
          symbol: '@trivago/prettier-plugin-sort-imports',
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'binaries',
      value: 1,
      displayValue: '1 binary',
      score: 0,
      details: {
        issues: [
          {
            message: 'Binary @trivago/prettier-plugin-sort-imports unused',
            severity: 'error',
            source: {
              file: '/package.json',
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for unresolved', () => {
    expect(
      createAuditOutputFromKnipIssues('unresolved', [
        {
          type: 'unresolved',
          filePath: 'package.json',
          symbol: '@trivago/prettier-plugin-sort-imports',
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'unresolved',
      value: 1,
      displayValue: '1 unresolved',
      score: 0,
      details: {
        issues: [
          {
            message: 'Unresolved @trivago/prettier-plugin-sort-imports unused',
            severity: 'error',
            source: {
              file: 'package.json',
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for exports', () => {
    expect(
      createAuditOutputFromKnipIssues('exports', [
        {
          type: 'exports',
          filePath: '/packages/models/src/lib/category-config.ts',
          symbol: 'duplicateRefsInCategoryMetricsErrorMsg',
          symbolType: 'function' as SymbolType,
          pos: 1571,
          line: 54,
          col: 17,
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'exports',
      value: 1,
      displayValue: '1 export',
      score: 0,
      details: {
        issues: [
          {
            message: 'Export duplicateRefsInCategoryMetricsErrorMsg unused',
            severity: 'error',
            source: {
              file: '/packages/models/src/lib/category-config.ts',
              position: {
                startColumn: 17,
                startLine: 54,
              },
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for nsExports', () => {
    expect(
      createAuditOutputFromKnipIssues('nsExports', [
        {
          type: 'nsExports',
          filePath: '/packages/models/src/lib/category-config.ts',
          symbol: 'duplicateRefsInCategoryMetricsErrorMsg',
          symbolType: 'function' as SymbolType,
          pos: 1571,
          line: 54,
          col: 17,
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'nsexports',
      value: 1,
      displayValue: '1 nsExport',
      score: 0,
      details: {
        issues: [
          {
            message: 'NsExport duplicateRefsInCategoryMetricsErrorMsg unused',
            severity: 'error',
            source: {
              file: '/packages/models/src/lib/category-config.ts',
              position: {
                startColumn: 17,
                startLine: 54,
              },
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for types', () => {
    expect(
      createAuditOutputFromKnipIssues('types', [
        {
          type: 'types',
          filePath: '/packages/models/src/lib/group.ts',
          symbol: 'GroupMeta',
          symbolType: 'type' as SymbolType,
          pos: 701,
          line: 26,
          col: 13,
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'types',
      value: 1,
      displayValue: '1 type',
      score: 0,
      details: {
        issues: [
          {
            message: 'Type GroupMeta unused',
            severity: 'error',
            source: {
              file: '/packages/models/src/lib/group.ts',
              position: {
                startColumn: 13,
                startLine: 26,
              },
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for nsTypes', () => {
    expect(
      createAuditOutputFromKnipIssues('nsTypes', [
        {
          type: 'nsTypes',
          filePath: '/packages/models/src/lib/group.ts',
          symbol: 'GroupMeta',
          symbolType: 'type' as SymbolType,
          pos: 701,
          line: 26,
          col: 13,
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'nstypes',
      value: 1,
      displayValue: '1 nsType',
      score: 0,
      details: {
        issues: [
          {
            message: 'NsType GroupMeta unused',
            severity: 'error',
            source: {
              file: '/packages/models/src/lib/group.ts',
              position: {
                startColumn: 13,
                startLine: 26,
              },
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for enumMembers', () => {
    expect(
      createAuditOutputFromKnipIssues('enumMembers', [
        {
          type: 'enumMembers',
          filePath: '/packages/models/src/lib/group.ts',
          symbol: 'GroupMeta',
          symbolType: 'type' as SymbolType,
          pos: 701,
          line: 26,
          col: 13,
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'enummembers',
      value: 1,
      displayValue: '1 enumMember',
      score: 0,
      details: {
        issues: [
          {
            message: 'EnumMember GroupMeta unused',
            severity: 'error',
            source: {
              file: '/packages/models/src/lib/group.ts',
              position: {
                startColumn: 13,
                startLine: 26,
              },
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for classMembers', () => {
    expect(
      createAuditOutputFromKnipIssues('classMembers', [
        {
          type: 'classMembers',
          filePath: '/packages/models/src/lib/group.ts',
          symbol: 'GroupMeta',
          symbolType: 'type' as SymbolType,
          pos: 701,
          line: 26,
          col: 13,
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'classmembers',
      value: 1,
      displayValue: '1 classMember',
      score: 0,
      details: {
        issues: [
          {
            message: 'ClassMember GroupMeta unused',
            severity: 'error',
            source: {
              file: '/packages/models/src/lib/group.ts',
              position: {
                startColumn: 13,
                startLine: 26,
              },
            },
          },
        ],
      },
    });
  });

  it('should return correct audit and issues for duplicates', () => {
    expect(
      createAuditOutputFromKnipIssues('duplicates', [
        {
          type: 'duplicates',
          filePath:
            '/packages/nx-plugin/src/generators/configuration/generator.ts',
          symbol: 'addToProjectGenerator|default',
          symbols: [
            {
              symbol: 'addToProjectGenerator',
              line: 10,
              col: 56,
              pos: 268,
            },
            {
              symbol: 'default',
              line: 52,
              col: 15,
              pos: 1197,
            },
          ],
          severity: 'error',
        },
      ]),
    ).toEqual({
      slug: 'duplicates',
      value: 1,
      displayValue: '1 duplicate',
      score: 0,
      details: {
        issues: [
          {
            message: 'Duplicate addToProjectGenerator|default unused',
            severity: 'error',
            source: {
              file: '/packages/nx-plugin/src/generators/configuration/generator.ts',
              position: {
                startColumn: 56,
                startLine: 10,
              },
            },
          },
        ],
      },
    });
  });
});
