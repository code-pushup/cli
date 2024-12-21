import {
  ClassDeclaration,
  Project,
  SourceFile,
  VariableStatement,
} from 'ts-morph';
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
 * Gets the variables information from the variable statements
 * @param variableStatements - The variable statements to process
 * @returns {Node[]} The variables information with the right methods to get the information
 */
export function getVariablesInformation(
  variableStatements: VariableStatement[],
) {
  return variableStatements.flatMap(variable => {
    // Get parent-level information
    const parentInfo = {
      getKind: () => variable.getKind(),
      getJsDocs: () => variable.getJsDocs(),
      getStartLineNumber: () => variable.getStartLineNumber(),
    };

    // Map each declaration to combine parent info with declaration-specific info
    return variable.getDeclarations().map(declaration => ({
      ...parentInfo,
      getName: () => declaration.getName(),
    }));
  });
}

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
export function getUnprocessedCoverageReport(
  sourceFiles: SourceFile[],
): CoverageResult {
  const unprocessedCoverageReport = sourceFiles.reduce(
    (coverageReportOfAllFiles, sourceFile) => {
      const filePath = sourceFile.getFilePath();
      const classes = sourceFile.getClasses();

      const allNodesFromFile = [
        ...sourceFile.getFunctions(),
        ...classes,
        ...getClassNodes(classes),
        ...sourceFile.getTypeAliases(),
        ...sourceFile.getEnums(),
        ...sourceFile.getInterfaces(),
        ...getVariablesInformation(sourceFile.getVariableStatements()),
      ];

      const coverageReportOfCurrentFile = allNodesFromFile.reduce(
        (acc, node) => {
          const nodeType = getCoverageTypeFromKind(node.getKind());
          const currentTypeReport = acc[nodeType];

          const updatedIssues =
            node.getJsDocs().length === 0
              ? [
                  ...currentTypeReport.issues,
                  {
                    file: filePath,
                    type: nodeType,
                    name: node.getName() || '',
                    line: node.getStartLineNumber(),
                  },
                ]
              : currentTypeReport.issues;

          return {
            ...acc,
            [nodeType]: {
              nodesCount: currentTypeReport.nodesCount + 1,
              issues: updatedIssues,
            },
          };
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
): UnprocessedCoverageResult {
  return Object.fromEntries(
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
  ) as UnprocessedCoverageResult;
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
