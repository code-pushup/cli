import type { ClassDeclaration, VariableStatement } from 'ts-morph';
import { nodeMock } from '../../../mocks/node.mock';
import { sourceFileMock } from '../../../mocks/source-files.mock';
import {
  getAllNodesFromASourceFile,
  getClassNodes,
  getDocumentationReport,
  getVariablesInformation,
  mergeDocumentationReports,
} from './doc-processer.js';
import type { DocumentationReport } from './models.js';

describe('getDocumentationReport', () => {
  it('should produce a full report', () => {
    const results = getDocumentationReport([
      sourceFileMock('test.ts', {
        functions: { 1: true, 2: true, 3: true },
        classes: { 4: false, 5: false, 6: true },
        enums: { 7: true, 8: false, 9: false },
        types: { 10: false, 11: false, 12: true, 40: true },
        interfaces: { 13: true, 14: true, 15: false },
        properties: { 16: false, 17: false, 18: false },
        variables: { 22: true, 23: true, 24: true },
      }),
    ]);
    expect(results).toMatchSnapshot();
  });

  it('should accept array of source files', () => {
    const results = getDocumentationReport([
      sourceFileMock('test.ts', { functions: { 1: true, 2: true, 3: false } }),
    ]);
    expect(results).toBeDefined();
  });

  it('should count nodes correctly', () => {
    const results = getDocumentationReport([
      sourceFileMock('test.ts', { functions: { 1: true, 2: true, 3: false } }),
    ]);

    expect(results.functions.nodesCount).toBe(3);
  });

  it('should collect uncommented nodes issues', () => {
    const results = getDocumentationReport([
      sourceFileMock('test.ts', { functions: { 1: true, 2: false, 3: false } }),
    ]);

    expect(results.functions.issues).toHaveLength(2);
  });

  it('should collect valid issues', () => {
    const results = getDocumentationReport([
      sourceFileMock('test.ts', { functions: { 1: false } }),
    ]);

    expect(results.functions.issues).toStrictEqual([
      {
        line: 1,
        file: 'test.ts',
        type: 'functions',
        name: 'test',
      },
    ]);
  });

  it('should calculate coverage correctly', () => {
    const results = getDocumentationReport([
      sourceFileMock('test.ts', { functions: { 1: true, 2: false } }),
    ]);

    expect(results.functions.coverage).toBe(50);
  });
});

describe('mergeDocumentationReports', () => {
  const emptyResult: DocumentationReport = {
    enums: { nodesCount: 0, issues: [] },
    interfaces: { nodesCount: 0, issues: [] },
    types: { nodesCount: 0, issues: [] },
    functions: { nodesCount: 0, issues: [] },
    variables: { nodesCount: 0, issues: [] },
    classes: { nodesCount: 0, issues: [] },
    methods: { nodesCount: 0, issues: [] },
    properties: { nodesCount: 0, issues: [] },
  };

  it.each([
    'enums',
    'interfaces',
    'types',
    'functions',
    'variables',
    'classes',
    'methods',
    'properties',
  ])('should merge results on top-level property: %s', type => {
    const secondResult = {
      [type]: {
        nodesCount: 1,
        issues: [{ file: 'test2.ts', line: 1, name: 'test2', type }],
      },
    };

    const results = mergeDocumentationReports(
      emptyResult,
      secondResult as Partial<DocumentationReport>,
    );
    expect(results).toStrictEqual(
      expect.objectContaining({
        [type]: {
          nodesCount: 1,
          issues: [{ file: 'test2.ts', line: 1, name: 'test2', type }],
        },
      }),
    );
  });

  it('should merge empty results', () => {
    const results = mergeDocumentationReports(emptyResult, emptyResult);
    expect(results).toStrictEqual(emptyResult);
  });

  it('should merge second level property nodesCount', () => {
    const results = mergeDocumentationReports(
      {
        ...emptyResult,
        enums: { nodesCount: 1, issues: [] },
      },
      {
        enums: { nodesCount: 1, issues: [] },
      },
    );
    expect(results.enums.nodesCount).toBe(2);
  });

  it('should merge second level property issues', () => {
    const results = mergeDocumentationReports(
      {
        ...emptyResult,
        enums: {
          nodesCount: 0,
          issues: [
            {
              file: 'file.enum-first.ts',
              line: 6,
              name: 'file.enum-first',
              type: 'enums',
            },
          ],
        },
      },
      {
        enums: {
          nodesCount: 0,
          issues: [
            {
              file: 'file.enum-second.ts',
              line: 5,
              name: 'file.enum-second',
              type: 'enums',
            },
          ],
        },
      },
    );
    expect(results.enums.issues).toStrictEqual([
      {
        file: 'file.enum-first.ts',
        line: 6,
        name: 'file.enum-first',
        type: 'enums',
      },
      {
        file: 'file.enum-second.ts',
        line: 5,
        name: 'file.enum-second',
        type: 'enums',
      },
    ]);
  });
});

describe('getClassNodes', () => {
  it('should return all nodes from a class', () => {
    const nodeMock1 = nodeMock({
      coverageType: 'classes',
      line: 1,
      file: 'test.ts',
      isCommented: false,
    });

    const classNodeSpy = vi.spyOn(nodeMock1, 'getMethods');
    const propertyNodeSpy = vi.spyOn(nodeMock1, 'getProperties');

    getClassNodes([nodeMock1] as unknown as ClassDeclaration[]);

    expect(classNodeSpy).toHaveBeenCalledTimes(1);
    expect(propertyNodeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('getVariablesInformation', () => {
  it('should process variable statements correctly', () => {
    const mockDeclaration = {
      getName: () => 'testVariable',
    };

    const mockVariableStatement = {
      getKind: () => 'const',
      getJsDocs: () => ['some docs'],
      getStartLineNumber: () => 42,
      getDeclarations: () => [mockDeclaration],
    };

    const result = getVariablesInformation([
      mockVariableStatement as unknown as VariableStatement,
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      getKind: expect.any(Function),
      getJsDocs: expect.any(Function),
      getStartLineNumber: expect.any(Function),
      getName: expect.any(Function),
    });
    // It must be defined
    expect(result[0]!.getName()).toBe('testVariable');
    expect(result[0]!.getKind()).toBe('const');
    expect(result[0]!.getJsDocs()).toEqual(['some docs']);
    expect(result[0]!.getStartLineNumber()).toBe(42);
  });

  it('should handle multiple declarations in a single variable statement', () => {
    const mockDeclarations = [
      { getName: () => 'var1' },
      { getName: () => 'var2' },
    ];

    const mockVariableStatement = {
      getKind: () => 'let',
      getJsDocs: () => [],
      getStartLineNumber: () => 10,
      getDeclarations: () => mockDeclarations,
    };

    const result = getVariablesInformation([
      mockVariableStatement as unknown as VariableStatement,
    ]);

    expect(result).toHaveLength(2);
    // They must be defined
    expect(result[0]!.getName()).toBe('var1');
    expect(result[1]!.getName()).toBe('var2');
    expect(result[0]!.getKind()).toBe('let');
    expect(result[1]!.getKind()).toBe('let');
  });

  it('should handle empty variable statements array', () => {
    const result = getVariablesInformation([]);
    expect(result).toHaveLength(0);
  });

  it('should handle variable statements without declarations', () => {
    const mockVariableStatement = {
      getKind: () => 'const',
      getJsDocs: () => [],
      getStartLineNumber: () => 1,
      getDeclarations: () => [],
    };

    const result = getVariablesInformation([
      mockVariableStatement as unknown as VariableStatement,
    ]);
    expect(result).toHaveLength(0);
  });
});

describe('getAllNodesFromASourceFile', () => {
  it('should combine all node types from a source file', () => {
    const mockSourceFile = sourceFileMock('test.ts', {
      functions: { 1: true },
      classes: { 2: false },
      types: { 3: true },
      enums: { 4: false },
      interfaces: { 5: true },
    });

    const result = getAllNodesFromASourceFile(mockSourceFile);

    expect(result).toHaveLength(5);
  });

  it('should handle empty source file', () => {
    const mockSourceFile = sourceFileMock('empty.ts', {});

    const result = getAllNodesFromASourceFile(mockSourceFile);

    expect(result).toHaveLength(0);
  });

  it('should handle source file with only functions', () => {
    const mockSourceFile = sourceFileMock('functions.ts', {
      functions: { 1: true, 2: false, 3: true },
    });

    const result = getAllNodesFromASourceFile(mockSourceFile);

    expect(result).toHaveLength(3);
  });
});
