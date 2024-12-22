import { SyntaxKind } from 'ts-morph';
import type {
  CoverageReportShape,
  CoverageResult,
  CoverageType,
} from './models.js';

/**
 * Creates an empty unprocessed coverage report.
 * @returns The empty unprocessed coverage report.
 */
export function createEmptyCoverageData(): CoverageReportShape {
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

/**
 * Calculates the coverage percentage for each coverage type.
 * @param result - The unprocessed coverage result.
 * @returns The processed coverage result.
 */
export function calculateCoverage(result: CoverageReportShape) {
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

/**
 * Maps the SyntaxKind from the library ts-morph to the coverage type.
 * @param kind - The SyntaxKind from the library ts-morph.
 * @returns The coverage type.
 */
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
    case SyntaxKind.VariableStatement:
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
