import type { SyntaxKind } from 'ts-morph';

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

export type CoverageType =
  SyntaxKindToStringLiteral[keyof SyntaxKindToStringLiteral];

export type UndocumentedNode = {
  file: string;
  type: CoverageType;
  name: string;
  line: number;
  class?: string;
};

export type CoverageData = {
  issues: UndocumentedNode[];
  nodesCount: number;
};

export type UnprocessedCoverageResult = Record<CoverageType, CoverageData>;

export type CoverageResult = Record<
  CoverageType,
  CoverageData & {
    coverage: number;
  }
>;
