import { SyntaxKind } from 'ts-morph';
import {
  type CoverageType,
  type DocumentationCoverageReport,
  type DocumentationReport,
  SYNTAX_COVERAGE_MAP,
} from './models.js';

/**
 * Creates an empty unprocessed coverage report.
 * @returns The empty unprocessed coverage report.
 */
export function createEmptyCoverageData(): DocumentationReport {
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
 * Converts the coverage type to the audit slug.
 * @param type - The coverage type.
 * @returns The audit slug.
 */
export function coverageTypeToAuditSlug(type: CoverageType) {
  return `${type}-coverage`;
}

/**
 * Calculates the coverage percentage for each coverage type.
 * @param result - The unprocessed coverage result.
 * @returns The processed coverage result.
 */
export function calculateCoverage(result: DocumentationReport) {
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
  ) as DocumentationCoverageReport;
}

/**
 * Maps the SyntaxKind from the library ts-morph to the coverage type.
 * @param kind - The SyntaxKind from the library ts-morph.
 * @returns The coverage type.
 */
export function getCoverageTypeFromKind(kind: SyntaxKind): CoverageType {
  const type = SYNTAX_COVERAGE_MAP.get(kind);

  if (!type) {
    throw new Error(`Unsupported syntax kind: ${kind}`);
  }
  return type;
}
