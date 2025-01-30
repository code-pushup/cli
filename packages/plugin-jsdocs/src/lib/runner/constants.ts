import { SyntaxKind } from 'ts-morph';
import type { CoverageType } from './models.js';

/** Maps the SyntaxKind from the library ts-morph to the coverage type. */
export const SYNTAX_COVERAGE_MAP = new Map<SyntaxKind, CoverageType>([
  [SyntaxKind.ClassDeclaration, 'classes'],
  [SyntaxKind.MethodDeclaration, 'methods'],
  [SyntaxKind.FunctionDeclaration, 'functions'],
  [SyntaxKind.InterfaceDeclaration, 'interfaces'],
  [SyntaxKind.EnumDeclaration, 'enums'],
  [SyntaxKind.VariableDeclaration, 'variables'],
  [SyntaxKind.VariableStatement, 'variables'],
  [SyntaxKind.PropertyDeclaration, 'properties'],
  [SyntaxKind.TypeAliasDeclaration, 'types'],
]);
