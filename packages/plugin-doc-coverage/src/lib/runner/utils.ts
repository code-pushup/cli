import { SyntaxKind } from 'ts-morph';
import type {
  CoverageResult,
  CoverageType,
  UnprocessedCoverageResult,
} from './models';

export function createEmptyUnprocessedCoverageReport(): UnprocessedCoverageResult {
  return {
    enums: { nodesCount: 0, issues: [] },
    interfaces: { nodesCount: 0, issues: [] },
    types: { nodesCount: 0, issues: [] },
    functions: { nodesCount: 0, issues: [] },
    variables: { nodesCount: 0, issues: [] },
    classes: { nodesCount: 0, issues: [] },
    methods: { nodesCount: 0, issues: [] },
    properties: { nodesCount: 0, issues: [] },
  };
}

export function calculateCoverage(result: UnprocessedCoverageResult) {
  return Object.fromEntries(
    Object.entries(result).map(([key, value]) => {
      const type = key as CoverageType;
      return [
        type,
        {
          coverage:
            value.nodesCount === 0
              ? 100
              : Number(
                  ((1 - value.issues.length / value.nodesCount) * 100).toFixed(
                    2,
                  ),
                ),
          issues: value.issues,
          nodesCount: value.nodesCount,
        },
      ];
    }),
  ) as CoverageResult;
}

export function getCoverageTypeFromKind(kind: SyntaxKind): CoverageType {
  switch (kind) {
    case SyntaxKind.ClassDeclaration:
      return 'classes';
    case SyntaxKind.MethodDeclaration:
      return 'methods';
    case SyntaxKind.FunctionDeclaration:
      return 'functions';
    case SyntaxKind.InterfaceDeclaration:
      return 'interfaces';
    case SyntaxKind.EnumDeclaration:
      return 'enums';
    case SyntaxKind.VariableDeclaration:
      return 'variables';
    case SyntaxKind.PropertyDeclaration:
      return 'properties';
    case SyntaxKind.TypeAliasDeclaration:
      return 'types';
    default:
      throw new Error(`Unsupported syntax kind: ${kind}`);
  }
}
