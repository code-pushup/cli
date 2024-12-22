import { SyntaxKind } from 'ts-morph';
import type { CoverageReportShape } from './models.js';
import {
  calculateCoverage,
  createEmptyCoverageData,
  getCoverageTypeFromKind,
} from './utils.js';

describe('createEmptyCoverageData', () => {
  it('should create an empty report with all categories initialized', () => {
    const result = createEmptyCoverageData();

    expect(result).toStrictEqual({
      enums: { nodesCount: 0, issues: [] },
      interfaces: { nodesCount: 0, issues: [] },
      types: { nodesCount: 0, issues: [] },
      functions: { nodesCount: 0, issues: [] },
      variables: { nodesCount: 0, issues: [] },
      classes: { nodesCount: 0, issues: [] },
      methods: { nodesCount: 0, issues: [] },
      properties: { nodesCount: 0, issues: [] },
    });
  });
});

describe('calculateCoverage', () => {
  it('should calculate 100% coverage when there are no nodes', () => {
    const input = createEmptyCoverageData();
    const result = calculateCoverage(input);

    Object.values(result).forEach(category => {
      expect(category.coverage).toBe(100);
      expect(category.nodesCount).toBe(0);
      expect(category.issues).toEqual([]);
    });
  });

  it('should calculate correct coverage percentage with issues', () => {
    const input: CoverageReportShape = {
      ...createEmptyCoverageData(),
      functions: {
        nodesCount: 4,
        issues: [
          { type: 'functions', line: 1, file: 'test.ts', name: 'fn1' },
          { type: 'functions', line: 2, file: 'test.ts', name: 'fn2' },
        ],
      },
      classes: {
        nodesCount: 4,
        issues: [
          { type: 'classes', line: 1, file: 'test.ts', name: 'Class1' },
          { type: 'classes', line: 2, file: 'test.ts', name: 'Class2' },
          { type: 'classes', line: 3, file: 'test.ts', name: 'Class3' },
        ],
      },
    };

    const result = calculateCoverage(input);

    expect(result.functions.coverage).toBe(50);
    expect(result.classes.coverage).toBe(25);
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
