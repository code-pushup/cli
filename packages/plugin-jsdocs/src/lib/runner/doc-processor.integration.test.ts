import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processJsDocs } from './doc-processor.js';
import type { DocumentationData } from './models.js';

type DocumentationDataCovered = DocumentationData & {
  coverage: number;
};

describe('processJsDocs', () => {
  const fixturesDir = path.join(
    fileURLToPath(path.dirname(import.meta.url)),
    '../../../mocks/fixtures',
  );

  it('should detect undocumented class', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/classes-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.classes).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.pathToEndWith('classes-coverage.ts'),
          type: 'classes',
          name: 'ExampleClass',
          line: 1,
        },
      ],
    } satisfies DocumentationDataCovered);
  });

  it('should detect documented class', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/classes-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.classes).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationDataCovered);
  });

  it('should detect undocumented method', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/methods-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.methods).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.pathToEndWith('methods-coverage.ts'),
          type: 'methods',
          name: 'exampleMethod',
          line: 5,
        },
      ],
    } satisfies DocumentationDataCovered);
  });

  it('should detect documented method', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/methods-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.methods).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationDataCovered);
  });

  it('should detect undocumented interface', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/interfaces-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.interfaces).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.pathToEndWith('interfaces-coverage.ts'),
          type: 'interfaces',
          name: 'ExampleInterface',
          line: 1,
        },
      ],
    } satisfies DocumentationDataCovered);
  });

  it('should detect documented interface', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/interfaces-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.interfaces).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationDataCovered);
  });

  it('should detect undocumented variable', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/variables-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.variables).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.pathToEndWith('variables-coverage.ts'),
          type: 'variables',
          name: 'exampleVariable',
          line: 1,
        },
      ],
    } satisfies DocumentationDataCovered);
  });

  it('should detect documented variable', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/variables-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.variables).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationDataCovered);
  });

  it('should detect undocumented property', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/properties-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.properties).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.pathToEndWith('properties-coverage.ts'),
          type: 'properties',
          name: 'exampleProperty',
          line: 5,
        },
      ],
    } satisfies DocumentationDataCovered);
  });

  it('should detect documented property', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/properties-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.properties).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationDataCovered);
  });

  it('should detect undocumented type', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/types-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.types).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.pathToEndWith('types-coverage.ts'),
          type: 'types',
          name: 'ExampleType',
          line: 1,
        },
      ],
    } satisfies DocumentationDataCovered);
  });

  it('should detect documented type', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/types-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.types).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationDataCovered);
  });

  it('should detect undocumented enum', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/enums-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.enums).toStrictEqual({
      coverage: 0,
      nodesCount: 1,
      issues: [
        {
          file: expect.pathToEndWith('enums-coverage.ts'),
          type: 'enums',
          name: 'ExampleEnum',
          line: 1,
        },
      ],
    } satisfies DocumentationDataCovered);
  });

  it('should detect documented enum', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/enums-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.enums).toStrictEqual({
      coverage: 100,
      nodesCount: 1,
      issues: [],
    } satisfies DocumentationDataCovered);
  });
});
