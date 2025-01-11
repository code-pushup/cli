import {
  ClassDeclaration,
  JSDoc,
  Project,
  SourceFile,
  SyntaxKind,
  VariableStatement,
} from 'ts-morph';
import { objectFromEntries, objectToEntries } from '@code-pushup/utils';
import type { JsDocsPluginConfig } from '../config.js';
import type {
  DocumentationCoverageReport,
  DocumentationReport,
} from './models.js';
import {
  calculateCoverage,
  createEmptyCoverageData,
  getCoverageTypeFromKind,
} from './utils.js';

type Node = {
  getKind: () => SyntaxKind;
  getName: () => string;
  getStartLineNumber: () => number;
  getJsDocs: () => JSDoc[];
};

/**
 * Gets the variables information from the variable statements
 * @param variableStatements - The variable statements to process
 * @returns The variables information with the right methods to get the information
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
 * @param config - The configuration object containing patterns to include for documentation analysis
 * @returns Object containing coverage statistics and undocumented items
 */
export function processJsDocs(
  config: JsDocsPluginConfig,
): DocumentationCoverageReport {
  const project = new Project();
  project.addSourceFilesAtPaths(config.patterns);
  return getDocumentationReport(project.getSourceFiles());
}

export function getAllNodesFromASourceFile(sourceFile: SourceFile) {
  const classes = sourceFile.getClasses();
  return [
    ...sourceFile.getFunctions(),
    ...classes,
    ...getClassNodes(classes),
    ...sourceFile.getTypeAliases(),
    ...sourceFile.getEnums(),
    ...sourceFile.getInterfaces(),
    ...getVariablesInformation(sourceFile.getVariableStatements()),
  ];
}

/**
 * Gets the documentation coverage report from the source files
 * @param sourceFiles - The source files to process
 * @returns The documentation coverage report
 */
export function getDocumentationReport(
  sourceFiles: SourceFile[],
): DocumentationCoverageReport {
  const unprocessedCoverageReport = sourceFiles.reduce(
    (coverageReportOfAllFiles, sourceFile) => {
      const filePath = sourceFile.getFilePath();
      const allNodesFromFile = getAllNodesFromASourceFile(sourceFile);

      const coverageReportOfCurrentFile = getCoverageFromAllNodesOfFile(
        allNodesFromFile as Node[],
        filePath,
      );

      return mergeDocumentationReports(
        coverageReportOfAllFiles,
        coverageReportOfCurrentFile,
      );
    },
    createEmptyCoverageData(),
  );

  return calculateCoverage(unprocessedCoverageReport);
}

/**
 * Gets the coverage from all nodes of a file
 * @param nodes - The nodes to process
 * @param filePath - The file path where the nodes are located
 * @returns The coverage report for the nodes
 */
function getCoverageFromAllNodesOfFile(nodes: Node[], filePath: string) {
  return nodes.reduce((acc: DocumentationReport, node: Node) => {
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
  }, createEmptyCoverageData());
}

/**
 * Merges two documentation results
 * @param accumulatedReport - The first empty documentation result
 * @param currentFileReport - The second documentation result
 * @returns The merged documentation result
 */
export function mergeDocumentationReports(
  accumulatedReport: DocumentationReport,
  currentFileReport: Partial<DocumentationReport>,
): DocumentationReport {
  return objectFromEntries(
    objectToEntries(accumulatedReport).map(([key, value]) => {
      const node = value;
      const type = key;
      return [
        type,
        {
          nodesCount:
            node.nodesCount + (currentFileReport[type]?.nodesCount ?? 0),
          issues: [...node.issues, ...(currentFileReport[type]?.issues ?? [])],
        },
      ];
    }),
  );
}

/**
 * Gets the nodes from a class
 * @param classNodes - The class nodes to process
 * @returns The nodes from the class
 */
export function getClassNodes(classNodes: ClassDeclaration[]) {
  return classNodes.flatMap(classNode => [
    ...classNode.getMethods(),
    ...classNode.getProperties(),
  ]);
}
