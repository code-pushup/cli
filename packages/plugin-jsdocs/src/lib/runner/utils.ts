import { SyntaxKind } from 'ts-morph';
import { SYNTAX_COVERAGE_MAP } from './constants.js';
import type { CoverageType } from './models.js';

/**
 * Creates an empty unprocessed coverage report.
 * @param initialValue - Initial value for each coverage type
 * @returns The empty unprocessed coverage report.
 */
export function createInitialCoverageTypesRecord<T>(
  initialValue: T,
): Record<CoverageType, T> {
  return {
    enums: initialValue,
    interfaces: initialValue,
    types: initialValue,
    functions: initialValue,
    variables: initialValue,
    classes: initialValue,
    methods: initialValue,
    properties: initialValue,
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

/**
 * Convert plural coverage type to singular form
 * @param type Coverage type (plural)
 * @returns Singular form of coverage type
 */
export function singularCoverageType(type: CoverageType): string {
  switch (type) {
    case 'classes':
      return 'class';
    case 'enums':
      return 'enum';
    case 'functions':
      return 'function';
    case 'interfaces':
      return 'interface';
    case 'methods':
      return 'method';
    case 'properties':
      return 'property';
    case 'types':
      return 'type';
    case 'variables':
      return 'variable';
  }
}
