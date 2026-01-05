import {
  ClassDeclaration,
  JSDoc,
  Project,
  SourceFile,
  SyntaxKind,
  VariableStatement,
} from 'ts-morph';
import {
  type FileCoverage,
  objectFromEntries,
  objectToEntries,
  profiler,
} from '@code-pushup/utils';
import type { JsDocsPluginTransformedConfig } from '../config.js';
import type { CoverageType } from './models.js';
import {
  createInitialCoverageTypesRecord,
  getCoverageTypeFromKind,
  logReport,
  logSourceFiles,
  singularCoverageType,
} from './utils.js';

type Node = {
  getKind: () => SyntaxKind;
  getName: () => string | undefined;
  getStartLineNumber: () => number;
  getEndLineNumber: () => number;
  getJsDocs: () => JSDoc[];
};

/**
 * Gets the variables information from the variable statements
 * @param variableStatements The variable statements to process
 * @returns The variables information with the right methods to get the information
 */
export function getVariablesInformation(
  variableStatements: VariableStatement[],
): Node[] {
  return variableStatements.flatMap(variable => {
    // Get parent-level information
    const parentInfo = {
      getKind: () => variable.getKind(),
      getJsDocs: () => variable.getJsDocs(),
      getStartLineNumber: () => variable.getStartLineNumber(),
      getEndLineNumber: () => variable.getEndLineNumber(),
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
 * @param config The configuration object containing patterns to include for documentation analysis
 * @returns Object containing coverage statistics and undocumented items
 */
export function processJsDocs(
  config: JsDocsPluginTransformedConfig,
): Record<CoverageType, FileCoverage[]> {
  const sourceFiles = profiler.measure(
    'plugin-jsdocs:typescript-program-exec',
    () => {
      const project = new Project();
      project.addSourceFilesAtPaths(config.patterns);
      return project.getSourceFiles();
    },
    {
      ...profiler.measureConfig.tracks.pluginJsDocs,
      color: 'tertiary-dark',
      success: (sourceFiles: SourceFile[]) => ({
        properties: [
          ['Files', String(sourceFiles.length)],
          ['Patterns', String(config.patterns.length)],
        ],
        tooltipText: `TypeScript program executed on ${sourceFiles.length} files for JSDocs analysis`,
      }),
    },
  );

  logSourceFiles(sourceFiles, config);

  const report = getDocumentationReport(sourceFiles);

  logReport(report);

  return report;
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
 * @param sourceFiles The source files to process
 * @returns The documentation coverage report
 */
export function getDocumentationReport(
  sourceFiles: SourceFile[],
): Record<CoverageType, FileCoverage[]> {
  return sourceFiles.reduce((acc, sourceFile) => {
    const filePath = sourceFile.getFilePath();
    const nodes = getAllNodesFromASourceFile(sourceFile);
    const coverageTypes = getCoverageFromAllNodesOfFile(nodes, filePath);
    return objectFromEntries(
      objectToEntries(coverageTypes).map(([type, file]) => [
        type,
        [...acc[type], file],
      ]),
    );
  }, createInitialCoverageTypesRecord<FileCoverage[]>([]));
}

/**
 * Gets the coverage from all nodes of a file
 * @param nodes The nodes to process
 * @param filePath The file path where the nodes are located
 * @returns The coverage report for the nodes
 */
function getCoverageFromAllNodesOfFile(nodes: Node[], filePath: string) {
  return nodes.reduce(
    (acc: Record<CoverageType, FileCoverage>, node: Node) => {
      const nodeType = getCoverageTypeFromKind(node.getKind());
      const isCovered = node.getJsDocs().length > 0;

      return {
        ...acc,
        [nodeType]: {
          ...acc[nodeType],
          total: acc[nodeType].total + 1,
          ...(isCovered
            ? {
                covered: acc[nodeType].covered + 1,
              }
            : {
                missing: [
                  ...acc[nodeType].missing,
                  {
                    kind: singularCoverageType(nodeType),
                    name: node.getName(),
                    startLine: node.getStartLineNumber(),
                    endLine: node.getEndLineNumber(),
                  },
                ],
              }),
        },
      };
    },
    createInitialCoverageTypesRecord<FileCoverage>({
      path: filePath,
      covered: 0,
      total: 0,
      missing: [],
    }),
  );
}

/**
 * Gets the nodes from a class
 * @param classNodes The class nodes to process
 * @returns The nodes from the class
 */
export function getClassNodes(classNodes: ClassDeclaration[]) {
  return classNodes.flatMap(classNode => [
    ...classNode.getMethods(),
    ...classNode.getProperties(),
  ]);
}
