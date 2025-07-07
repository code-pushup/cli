import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FileCoverage } from '@code-pushup/utils';
import { processJsDocs } from './doc-processor.js';

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
    expect(results.classes).toStrictEqual([
      {
        path: expect.pathToEndWith('classes-coverage.ts'),
        covered: 0,
        total: 1,
        missing: [
          {
            kind: 'class',
            name: 'ExampleClass',
            startLine: 1,
            endLine: 1,
          },
        ],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect documented class', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/classes-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.classes).toStrictEqual([
      {
        path: expect.pathToEndWith('classes-coverage.ts'),
        covered: 1,
        total: 1,
        missing: [],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect undocumented method', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/methods-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.methods).toStrictEqual([
      {
        path: expect.pathToEndWith('methods-coverage.ts'),
        covered: 0,
        total: 1,
        missing: [
          {
            kind: 'method',
            name: 'exampleMethod',
            startLine: 5,
            endLine: 7,
          },
        ],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect documented method', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/methods-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.methods).toStrictEqual([
      {
        path: expect.pathToEndWith('methods-coverage.ts'),
        covered: 1,
        total: 1,
        missing: [],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect undocumented interface', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/interfaces-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.interfaces).toStrictEqual([
      {
        path: expect.pathToEndWith('interfaces-coverage.ts'),
        covered: 0,
        total: 1,
        missing: [
          {
            kind: 'interface',
            name: 'ExampleInterface',
            startLine: 1,
            endLine: 1,
          },
        ],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect documented interface', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/interfaces-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.interfaces).toStrictEqual([
      {
        path: expect.pathToEndWith('interfaces-coverage.ts'),
        covered: 1,
        total: 1,
        missing: [],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect undocumented variable', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/variables-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.variables).toStrictEqual([
      {
        path: expect.pathToEndWith('variables-coverage.ts'),
        covered: 0,
        total: 1,
        missing: [
          {
            kind: 'variable',
            name: 'exampleVariable',
            startLine: 1,
            endLine: 1,
          },
        ],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect documented variable', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/variables-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.variables).toStrictEqual([
      {
        path: expect.pathToEndWith('variables-coverage.ts'),
        covered: 1,
        total: 1,
        missing: [],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect undocumented property', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/properties-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.properties).toStrictEqual([
      {
        path: expect.pathToEndWith('properties-coverage.ts'),
        covered: 0,
        total: 1,
        missing: [
          {
            kind: 'property',
            name: 'exampleProperty',
            startLine: 5,
            endLine: 5,
          },
        ],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect documented property', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/properties-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.properties).toStrictEqual([
      {
        path: expect.pathToEndWith('properties-coverage.ts'),
        covered: 1,
        total: 1,
        missing: [],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect undocumented type', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/types-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.types).toStrictEqual([
      {
        path: expect.pathToEndWith('types-coverage.ts'),
        covered: 0,
        total: 1,
        missing: [
          {
            kind: 'type',
            name: 'ExampleType',
            startLine: 1,
            endLine: 1,
          },
        ],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect documented type', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/types-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.types).toStrictEqual([
      {
        path: expect.pathToEndWith('types-coverage.ts'),
        covered: 1,
        total: 1,
        missing: [],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect undocumented enum', () => {
    const sourcePath = path.join(
      fixturesDir,
      'missing-documentation/enums-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.enums).toStrictEqual([
      {
        path: expect.pathToEndWith('enums-coverage.ts'),
        covered: 0,
        total: 1,
        missing: [
          {
            kind: 'enum',
            name: 'ExampleEnum',
            startLine: 1,
            endLine: 1,
          },
        ],
      },
    ] satisfies FileCoverage[]);
  });

  it('should detect documented enum', () => {
    const sourcePath = path.join(
      fixturesDir,
      'filled-documentation/enums-coverage.ts',
    );
    const results = processJsDocs({ patterns: [sourcePath] });
    expect(results.enums).toStrictEqual([
      {
        path: expect.pathToEndWith('enums-coverage.ts'),
        covered: 1,
        total: 1,
        missing: [],
      },
    ] satisfies FileCoverage[]);
  });
});
