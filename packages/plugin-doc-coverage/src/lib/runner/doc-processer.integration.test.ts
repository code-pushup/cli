import { processDocCoverage } from './doc-processer.js';
import type { DocumentationData } from './models.js';

describe('Classes', () => {
  it('should detect undocumented class', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/missing-documentation/classes-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.classes).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.stringContaining('classes-coverage'),
          type: 'classes',
          name: 'ExampleClass',
          line: 1,
        },
      ],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });

  it('should detect documented class', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/filled-documentation/classes-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.classes).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });
});

describe('Methods', () => {
  it('should detect undocumented method', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/missing-documentation/methods-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.methods).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.stringContaining('methods-coverage'),
          type: 'methods',
          name: 'exampleMethod',
          line: 2,
        },
      ],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });

  it('should detect documented method', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/filled-documentation/methods-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.methods).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });
});

describe('Interfaces', () => {
  it('should detect undocumented interface', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/missing-documentation/interfaces-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.interfaces).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.stringContaining('interfaces-coverage'),
          type: 'interfaces',
          name: 'ExampleInterface',
          line: 1,
        },
      ],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });

  it('should detect documented interface', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/filled-documentation/interfaces-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.interfaces).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });
});

describe('Variables', () => {
  it('should detect undocumented variable', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/missing-documentation/variables-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.variables).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.stringContaining('variables-coverage'),
          type: 'variables',
          name: 'exampleVariable',
          line: 1,
        },
      ],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });

  it('should detect documented variable', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/filled-documentation/variables-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.variables).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });
});

describe('Properties', () => {
  it('should detect undocumented property', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/missing-documentation/properties-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.properties).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.stringContaining('properties-coverage'),
          type: 'properties',
          name: 'internalId',
          line: 2,
        },
      ],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });

  it('should detect documented property', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/filled-documentation/properties-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.properties).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });
});

describe('Types', () => {
  it('should detect undocumented type', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/missing-documentation/types-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.types).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.stringContaining('types-coverage'),
          type: 'types',
          name: 'ExampleType',
          line: 1,
        },
      ],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });

  it('should detect documented type', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/filled-documentation/types-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.types).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });
});

describe('Enums', () => {
  it('should detect undocumented enum', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/missing-documentation/enums-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.enums).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.stringContaining('enums-coverage'),
          type: 'enums',
          name: 'ExampleEnum',
          line: 1,
        },
      ],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });

  it('should detect documented enum', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/filled-documentation/enums-coverage.ts';
    const results = processDocCoverage({ sourceGlob: [sourcePath] });
    expect(results.enums).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationData & {
      coverage: number;
    });
  });
});
