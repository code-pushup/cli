import {
  ClassDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  InterfaceDeclaration,
  SourceFile,
  SyntaxKind,
  TypeAliasDeclaration,
  VariableStatement,
} from 'ts-morph';
import type { CoverageType } from '../src/lib/runner/models';

export function sourceFileMock(
  file: string,
  nodes: Partial<Record<CoverageType, Record<number, boolean>>>,
): SourceFile {
  const createNodeGetter = <T>(
    coverageType: CoverageType,
    nodeData?: Record<number, boolean>,
  ) => {
    if (!nodeData) return [];
    return Object.entries(nodeData).map(([line, isCommented]) =>
      nodeMock({ coverageType, line: Number(line), file, isCommented }),
    ) as unknown as T[];
  };

  return {
    getFilePath: () => file as any,
    getClasses: () =>
      createNodeGetter<ClassDeclaration>('classes', nodes.classes),
    getFunctions: () =>
      createNodeGetter<FunctionDeclaration>('functions', nodes.functions),
    getEnums: () => createNodeGetter<EnumDeclaration>('enums', nodes.enums),
    getTypeAliases: () =>
      createNodeGetter<TypeAliasDeclaration>('types', nodes.types),
    getInterfaces: () =>
      createNodeGetter<InterfaceDeclaration>('interfaces', nodes.interfaces),
    getVariableStatements: () =>
      createNodeGetter<VariableStatement>('variables', nodes.variables),
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
