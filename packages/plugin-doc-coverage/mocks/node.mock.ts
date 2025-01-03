import {SyntaxKind,} from 'ts-morph';
import type {CoverageType} from '../src/lib/runner/models.js';

export function nodeMock(options: {
  coverageType: CoverageType;
  line: number;
  file: string;
  isCommented: boolean;
}) {
  return {
    getKind: () => getKindFromCoverageType(options.coverageType),
    getJsDocs: () => (options.isCommented ? ['Comment'] : []),
    getName: () => 'test',
    getStartLineNumber: () => options.line,
    getDeclarations: () => [],
    // Only for classes
    getMethods: () => [],
    getProperties: () => [],
  };
}

function getKindFromCoverageType(coverageType: CoverageType): SyntaxKind {
  switch (coverageType) {
    case 'classes':
      return SyntaxKind.ClassDeclaration;
    case 'methods':
      return SyntaxKind.MethodDeclaration;
    case 'functions':
      return SyntaxKind.FunctionDeclaration;
    case 'interfaces':
      return SyntaxKind.InterfaceDeclaration;
    case 'enums':
      return SyntaxKind.EnumDeclaration;
    case 'variables':
      return SyntaxKind.VariableDeclaration;
    case 'properties':
      return SyntaxKind.PropertyDeclaration;
    case 'types':
      return SyntaxKind.TypeAliasDeclaration;
    default:
      throw new Error(`Unsupported syntax kind: ${coverageType}`);
  }
}
