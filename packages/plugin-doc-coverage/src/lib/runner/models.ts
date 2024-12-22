import type { SyntaxKind } from 'ts-morph';

/** Maps the SyntaxKind from the library ts-morph to the coverage type. */
type SyntaxKindToStringLiteral = {
  [SyntaxKind.ClassDeclaration]: 'classes';
  [SyntaxKind.MethodDeclaration]: 'methods';
  [SyntaxKind.FunctionDeclaration]: 'functions';
  [SyntaxKind.InterfaceDeclaration]: 'interfaces';
  [SyntaxKind.EnumDeclaration]: 'enums';
  [SyntaxKind.VariableDeclaration]: 'variables';
  [SyntaxKind.PropertyDeclaration]: 'properties';
  [SyntaxKind.TypeAliasDeclaration]: 'types';
};

/**The coverage type is the same as the SyntaxKind from the library ts-morph but as a string. */
export type CoverageType =
  SyntaxKindToStringLiteral[keyof SyntaxKindToStringLiteral];

/** The undocumented node is the node that is not documented and has the information for the report. */
export type UndocumentedNode = {
  file: string;
  type: CoverageType;
  name: string;
  line: number;
  class?: string;
};

/** The coverage data is the data that is used to create the coverage report. Without coverage stats. */
export type CoverageData = {
  issues: UndocumentedNode[];
  nodesCount: number;
};

/** The coverage report shape the report of every CoverageType without coverage stats. */
export type CoverageReportShape = Record<CoverageType, CoverageData>;

/** The processed coverage result CoverageData but for each coverage type and with coverage stats. */
export type CoverageResult = Record<
  CoverageType,
  CoverageData & {
    coverage: number;
  }
>;
