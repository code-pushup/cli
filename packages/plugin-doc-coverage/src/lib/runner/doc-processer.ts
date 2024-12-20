import { ClassDeclaration, Project, SourceFile } from 'ts-morph';
import type { DocCoveragePluginConfig } from '../config.js';
import type {
  CoverageResult,
  CoverageType,
  UnprocessedCoverageResult,
} from './models.js';
import {
  calculateCoverage,
  createEmptyUnprocessedCoverageReport,
  getCoverageTypeFromKind,
} from './utils.js';

/**
 * Processes documentation coverage for TypeScript files in the specified path
 * @param toInclude - The file path pattern to include for documentation analysis
 * @returns {CoverageResult} Object containing coverage statistics and undocumented items
 */
export function processDocCoverage(
  config: DocCoveragePluginConfig,
): CoverageResult {
  const project = new Project();
  project.addSourceFilesAtPaths(config.sourceGlob);
  return getUnprocessedCoverageReport(project.getSourceFiles());
}

/**
 * Gets the unprocessed coverage report from the source files
 * @param sourceFiles - The source files to process
 * @returns {UnprocessedCoverageResult} The unprocessed coverage report
 */
export function getUnprocessedCoverageReport(sourceFiles: SourceFile[]) {
  const unprocessedCoverageReport = sourceFiles.reduce(
    (coverageReportOfAllFiles, sourceFile) => {
      // Info of the file
      const filePath = sourceFile.getFilePath();
      const classes = sourceFile.getClasses();

      // All nodes of the file
      const allNodesFromFile = [
        ...sourceFile.getFunctions(),
        ...classes,
        ...getClassNodes(classes),
        ...sourceFile.getTypeAliases(),
        ...sourceFile.getEnums(),
        ...sourceFile.getInterfaces(),
        // ...sourceFile.getVariableStatements().flatMap(statement => statement.getDeclarations())
      ];

      const coverageReportOfCurrentFile = allNodesFromFile.reduce(
        (acc, node) => {
          const nodeType = getCoverageTypeFromKind(node.getKind());
          acc[nodeType].nodesCount++;
          if (node.getJsDocs().length === 0) {
            acc[nodeType].issues.push({
              file: filePath,
              type: nodeType,
              name: node.getName() || '',
              line: node.getStartLineNumber(),
            });
          }
          return acc;
        },
        createEmptyUnprocessedCoverageReport(),
      );

      return mergeCoverageResults(
        coverageReportOfAllFiles,
        coverageReportOfCurrentFile,
      );
    },
    createEmptyUnprocessedCoverageReport(),
  );

  return calculateCoverage(unprocessedCoverageReport);
}

/**
 * Merges two coverage results
 * @param results - The first empty coverage result
 * @param current - The second coverage result
 * @returns {UnprocessedCoverageResult} The merged coverage result
 */
export function mergeCoverageResults(
  results: UnprocessedCoverageResult,
  current: Partial<UnprocessedCoverageResult>,
) {
  return {
    ...Object.fromEntries(
      Object.entries(results).map(([key, value]) => {
        const node = value as CoverageResult[CoverageType];
        const type = key as CoverageType;
        return [
          type,
          {
            nodesCount: node.nodesCount + (current[type]?.nodesCount ?? 0),
            issues: [...node.issues, ...(current[type]?.issues ?? [])],
          },
        ];
      }),
    ),
  } as UnprocessedCoverageResult;
}

/**
 * Gets the nodes from a class
 * @param classNodes - The class nodes to process
 * @returns {Node[]} The nodes from the class
 */
export function getClassNodes(classNodes: ClassDeclaration[]) {
  return classNodes.flatMap(classNode => [
    ...classNode.getMethods(),
    ...classNode.getProperties(),
  ]);
}
