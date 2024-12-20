import {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
} from 'ts-morph';
import type { CoverageType } from '../src/lib/models';

export function sourceFileMock(
  file: string,
  nodes: Partial<Record<CoverageType, Record<number, boolean>>>,
): SourceFile {
  return {
    getFilePath: () => file as any,
    getClasses: () =>
      nodes.classes
        ? (Object.entries(nodes.classes).map(([line, isCommented]) =>
            nodeMock({
              coverageType: 'classes',
              line: Number(line),
              file,
              isCommented,
            }),
          ) as unknown as ClassDeclaration[])
        : [],
    getFunctions: () =>
      nodes.functions
        ? (Object.entries(nodes.functions).map(([line, isCommented]) =>
            nodeMock({
              coverageType: 'functions',
              line: Number(line),
              file,
              isCommented,
            }),
          ) as unknown as FunctionDeclaration[])
        : [],
    getEnums: () =>
      nodes.enums
        ? (Object.entries(nodes.enums).map(([line, isCommented]) =>
            nodeMock({
              coverageType: 'enums',
              line: Number(line),
              file,
              isCommented,
            }),
          ) as unknown as EnumDeclaration[])
        : [],
    getTypeAliases: () =>
      nodes.types
        ? (Object.entries(nodes.types).map(([line, isCommented]) =>
            nodeMock({
              coverageType: 'types',
              line: Number(line),
              file,
              isCommented,
            }),
          ) as unknown as TypeAliasDeclaration[])
        : [],
    getInterfaces: () =>
      nodes.interfaces
        ? (Object.entries(nodes.interfaces).map(([line, isCommented]) =>
            nodeMock({
              coverageType: 'interfaces',
              line: Number(line),
              file,
              isCommented,
            }),
          ) as unknown as InterfaceDeclaration[])
        : [],
  } as SourceFile;
}

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
