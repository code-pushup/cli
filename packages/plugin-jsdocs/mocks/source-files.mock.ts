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
import type { CoverageType } from '../src/lib/runner/models.js';
import { nodeMock } from './node.mock';

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
