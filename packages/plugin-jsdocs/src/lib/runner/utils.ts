import { type SourceFile, SyntaxKind } from 'ts-morph';
import {
  type FileCoverage,
  aggregateCoverageStats,
  capitalize,
  formatAsciiTable,
  formatCoveragePercentage,
  logger,
  objectToEntries,
  pluralize,
  pluralizeToken,
  toArray,
} from '@code-pushup/utils';
import type { JsDocsPluginTransformedConfig } from '../config.js';
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

export function logSourceFiles(
  sourceFiles: SourceFile[],
  config: JsDocsPluginTransformedConfig,
): void {
  const patterns = toArray(config.patterns);
  logger.info(
    `Found ${pluralizeToken('source file', sourceFiles.length)} matching ${pluralize('pattern', patterns.length)} ${patterns.join(' ')}`,
  );
}

export function logReport(report: Record<CoverageType, FileCoverage[]>): void {
  const typesCount = Object.keys(report).length;
  logger.info(
    `Collected documentation coverage for ${pluralizeToken('type', typesCount)} of ${pluralize('entity', typesCount)}`,
  );
  if (!logger.isVerbose()) {
    return;
  }

  logger.debug(
    formatAsciiTable({
      columns: [
        { key: 'type', label: 'Entity', align: 'left' },
        { key: 'covered', label: 'Hits', align: 'right' },
        { key: 'total', label: 'Found', align: 'right' },
        { key: 'coverage', label: 'Coverage', align: 'right' },
      ],
      rows: objectToEntries(report)
        .map(([type, files]) => {
          const stats = aggregateCoverageStats(files);
          return {
            ...stats,
            type: capitalize(type),
            coverage: formatCoveragePercentage(stats),
          };
        })
        .toSorted((a, b) => b.total - a.total),
    }),
  );
}
