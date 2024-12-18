import { Project } from 'ts-morph';
import type {
  CoverageByType,
  CoverageKey,
  CoverageResult,
  DocumentationStats,
  UndocumentedItem,
} from '../models.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable functional/immutable-data */
/* eslint-disable @typescript-eslint/max-params */
/* eslint-disable functional/no-let */

/**
 * Processes documentation coverage for TypeScript files in the specified path
 * @param toInclude - The file path pattern to include for documentation analysis
 * @returns {CoverageResult} Object containing coverage statistics and undocumented items
 */
export function processDocCoverage(toInclude: string): CoverageResult {
  const project = new Project();
  project.addSourceFilesAtPaths(toInclude);

  const stats: Record<CoverageKey, DocumentationStats> = {
    functions: { documented: 0, total: 0 },
    variables: { documented: 0, total: 0 },
    classes: { documented: 0, total: 0 },
    methods: { documented: 0, total: 0 },
    properties: { documented: 0, total: 0 },
    interfaces: { documented: 0, total: 0 },
    types: { documented: 0, total: 0 },
  };

  const undocumentedItems: UndocumentedItem[] = [];

  project.getSourceFiles().forEach(sourceFile => {
    if (isTestFile(sourceFile.getFilePath())) {
      return;
    }

    processClassDeclarations(sourceFile, undocumentedItems, stats);
    processDeclarations(sourceFile, undocumentedItems, stats);
  });

  return {
    undocumentedItems,
    currentCoverage: calculateOverallCoverage(stats),
    coverageByType: calculateCoverageByType(stats),
  };
}

/**
 * Checks if a file is a test file based on its path
 * @param filePath - The path of the file to check
 * @returns {boolean} True if the file is a test file, false otherwise
 */
function isTestFile(filePath: string): boolean {
  return filePath.includes('.spec.') || filePath.includes('.test.');
}

/**
 * Creates an undocumented item entry
 * @param file - The file path where the item was found
 * @param type - The type of the undocumented item
 * @param name - The name of the undocumented item
 * @param line - The line number where the item appears
 * @returns {UndocumentedItem} The undocumented item entry
 */
function addUndocumentedItem(
  file: string,
  type: CoverageKey,
  name: string,
  line: number,
): UndocumentedItem {
  return { file, type, name, line };
}

/**
 * Processes class declarations in a source file and updates documentation statistics
 * @param sourceFile - The source file to process
 * @param undocumentedItems - Array to store undocumented items found
 * @param stats - Object to track documentation statistics
 */
function processClassDeclarations(
  sourceFile: any,
  undocumentedItems: UndocumentedItem[],
  stats: Record<CoverageKey, DocumentationStats>,
): void {
  sourceFile.getClasses().forEach((classDeclaration: any) => {
    const className = classDeclaration.getName() || 'Anonymous Class';
    const filePath = sourceFile.getFilePath();
    stats.classes.total++;

    if (classDeclaration.getJsDocs().length === 0) {
      undocumentedItems.push(
        addUndocumentedItem(
          filePath,
          'classes',
          className,
          classDeclaration.getStartLineNumber(),
        ),
      );
    } else {
      stats.classes.documented++;
    }

    // Process properties
    classDeclaration.getProperties().forEach((property: any) => {
      stats.properties.total++;
      if (property.getJsDocs().length === 0) {
        undocumentedItems.push(
          addUndocumentedItem(
            filePath,
            'properties',
            property.getName(),
            property.getStartLineNumber(),
          ),
        );
      } else {
        stats.properties.documented++;
      }
    });

    // Process methods
    classDeclaration.getMethods().forEach((method: any) => {
      stats.methods.total++;
      if (method.getJsDocs().length === 0) {
        undocumentedItems.push(
          addUndocumentedItem(
            filePath,
            'methods',
            method.getName(),
            method.getStartLineNumber(),
          ),
        );
      } else {
        stats.methods.documented++;
      }
    });
  });
}

/**
 * Processes declarations (functions, variables, interfaces, and types) in a source file
 * @param sourceFile - The source file to process
 * @param undocumentedItems - Array to store undocumented items found
 * @param stats - Object to track documentation statistics
 */
function processDeclarations(
  sourceFile: any,
  undocumentedItems: UndocumentedItem[],
  stats: Record<CoverageKey, DocumentationStats>,
): void {
  const filePath = sourceFile.getFilePath();

  // Process functions
  processItems(
    sourceFile.getFunctions(),
    'functions',
    item => item.getName() || 'Anonymous Function',
    filePath,
    undocumentedItems,
    stats,
  );

  // Process variables
  sourceFile.getVariableStatements().forEach((statement: any) => {
    statement.getDeclarations().forEach((declaration: any) => {
      stats.variables.total++;
      if (statement.getJsDocs().length === 0) {
        undocumentedItems.push(
          addUndocumentedItem(
            filePath,
            'variables',
            declaration.getName(),
            declaration.getStartLineNumber(),
          ),
        );
      } else {
        stats.variables.documented++;
      }
    });
  });

  // Process interfaces and types
  processItems(
    sourceFile.getInterfaces(),
    'interfaces',
    item => item.getName(),
    filePath,
    undocumentedItems,
    stats,
  );
  processItems(
    sourceFile.getTypeAliases(),
    'types',
    item => item.getName(),
    filePath,
    undocumentedItems,
    stats,
  );
}

/**
 * Generic function to process a collection of items and update documentation statistics
 * @param items - Array of items to process
 * @param type - The type of items being processed
 * @param getName - Function to extract the name from an item
 * @param filePath - The path of the file being processed
 * @param undocumentedItems - Array to store undocumented items found
 * @param stats - Object to track documentation statistics
 */
function processItems(
  items: any[],
  type: CoverageKey,
  getName: (item: any) => string,
  filePath: string,
  undocumentedItems: UndocumentedItem[],
  stats: Record<CoverageKey, DocumentationStats>,
): void {
  items.forEach(item => {
    stats[type].total++;
    if (item.getJsDocs().length === 0) {
      undocumentedItems.push(
        addUndocumentedItem(
          filePath,
          type,
          getName(item),
          item.getStartLineNumber(),
        ),
      );
    } else {
      stats[type].documented++;
    }
  });
}

/**
 * Calculates the overall documentation coverage percentage
 * @param stats - Object containing documentation statistics
 * @returns {number} The overall coverage percentage (0-100)
 */
function calculateOverallCoverage(
  stats: Record<CoverageKey, DocumentationStats>,
): number {
  let totalDocumented = 0;
  let totalItems = 0;

  Object.values(stats).forEach(({ documented, total }) => {
    totalDocumented += documented;
    totalItems += total;
  });

  return totalItems === 0 ? 0 : (totalDocumented / totalItems) * 100;
}

/**
 * Calculates documentation coverage percentage for each type
 * @param stats - Object containing documentation statistics
 * @returns {CoverageByType} Object containing coverage percentages for each type
 */
function calculateCoverageByType(
  stats: Record<CoverageKey, DocumentationStats>,
): CoverageByType {
  const calculatePercentage = (documented: number, total: number) =>
    total === 0 ? 0 : Number(((documented / total) * 100).toFixed(2));

  return {
    functions: calculatePercentage(
      stats.functions.documented,
      stats.functions.total,
    ),
    variables: calculatePercentage(
      stats.variables.documented,
      stats.variables.total,
    ),
    classes: calculatePercentage(stats.classes.documented, stats.classes.total),
    methods: calculatePercentage(stats.methods.documented, stats.methods.total),
    properties: calculatePercentage(
      stats.properties.documented,
      stats.properties.total,
    ),
    interfaces: calculatePercentage(
      stats.interfaces.documented,
      stats.interfaces.total,
    ),
    types: calculatePercentage(stats.types.documented, stats.types.total),
  };
}
