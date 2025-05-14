import { SyntaxKind } from 'ts-morph';
import {
  createInitialCoverageTypesRecord,
  getCoverageTypeFromKind,
} from './utils.js';

describe('createInitialCoverageTypesRecord', () => {
  it('should create an empty report with all categories initialized', () => {
    const result = createInitialCoverageTypesRecord([]);

    expect(result).toStrictEqual({
      enums: [],
      interfaces: [],
      types: [],
      functions: [],
      variables: [],
      classes: [],
      methods: [],
      properties: [],
    });
  });
});

describe('getCoverageTypeFromKind', () => {
  it.each([
    [SyntaxKind.ClassDeclaration, 'classes'],
    [SyntaxKind.MethodDeclaration, 'methods'],
    [SyntaxKind.FunctionDeclaration, 'functions'],
    [SyntaxKind.InterfaceDeclaration, 'interfaces'],
    [SyntaxKind.EnumDeclaration, 'enums'],
    [SyntaxKind.VariableDeclaration, 'variables'],
    [SyntaxKind.PropertyDeclaration, 'properties'],
    [SyntaxKind.TypeAliasDeclaration, 'types'],
  ])('should return %s for SyntaxKind.%s', (kind, expectedType) => {
    expect(getCoverageTypeFromKind(kind)).toBe(expectedType);
  });

  it('should throw error for unsupported syntax kind', () => {
    expect(() => getCoverageTypeFromKind(SyntaxKind.Unknown)).toThrow(
      'Unsupported syntax kind',
    );
  });
});
