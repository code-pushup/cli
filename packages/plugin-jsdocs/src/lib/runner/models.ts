import { SyntaxKind } from 'ts-morph';

/** The possible coverage types for documentation analysis */
export const SINTAX_KIND_LITERAL_STRING = {
  CLASSES: 'classes',
  METHODS: 'methods',
  FUNCTIONS: 'functions',
  INTERFACES: 'interfaces',
  ENUMS: 'enums',
  VARIABLES: 'variables',
  PROPERTIES: 'properties',
  TYPES: 'types',
} as const;

export type CoverageType =
  (typeof SINTAX_KIND_LITERAL_STRING)[keyof typeof SINTAX_KIND_LITERAL_STRING];

/** Maps the SyntaxKind from the library ts-morph to the coverage type. */
export const SYNTAX_COVERAGE_MAP = new Map<SyntaxKind, CoverageType>([
  [SyntaxKind.ClassDeclaration, SINTAX_KIND_LITERAL_STRING.CLASSES],
  [SyntaxKind.MethodDeclaration, SINTAX_KIND_LITERAL_STRING.METHODS],
  [SyntaxKind.FunctionDeclaration, SINTAX_KIND_LITERAL_STRING.FUNCTIONS],
  [SyntaxKind.InterfaceDeclaration, SINTAX_KIND_LITERAL_STRING.INTERFACES],
  [SyntaxKind.EnumDeclaration, SINTAX_KIND_LITERAL_STRING.ENUMS],
  [SyntaxKind.VariableDeclaration, SINTAX_KIND_LITERAL_STRING.VARIABLES],
  [SyntaxKind.VariableStatement, SINTAX_KIND_LITERAL_STRING.VARIABLES],
  [SyntaxKind.PropertyDeclaration, SINTAX_KIND_LITERAL_STRING.PROPERTIES],
  [SyntaxKind.TypeAliasDeclaration, SINTAX_KIND_LITERAL_STRING.TYPES],
]);

/** The undocumented node is the node that is not documented and has the information for the report. */
export type UndocumentedNode = {
  file: string;
  type: CoverageType;
  name: string;
  line: number;
  class?: string;
};

/** The documentation data has the issues and the total nodes count from a specific CoverageType. */
export type DocumentationData = {
  issues: UndocumentedNode[];
  nodesCount: number;
};

/** The documentation report has all the documentation data for each coverage type. */
export type DocumentationReport = Record<CoverageType, DocumentationData>;

/** The processed documentation result has the documentation data for each coverage type and with coverage stats. */
export type DocumentationCoverageReport = Record<
  CoverageType,
  DocumentationData & {
    coverage: number;
  }
>;
