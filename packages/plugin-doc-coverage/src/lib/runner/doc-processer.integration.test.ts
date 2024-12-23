import { processDocCoverage } from './doc-processer.js';

describe('processDocCoverage', () => {
  it('should count total nodes from TypeScript files correctly', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/angular/**/*.ts';
    const expectedNodeCount = 8;

    const results = processDocCoverage({ sourceGlob: [sourcePath] });

    const totalNodeCount = Object.values(results).reduce(
      (acc, node) => acc + node.nodesCount,
      0,
    );

    expect(totalNodeCount).toBe(expectedNodeCount);
  });

  it('should count total nodes from Javascript files correctly', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/react/**/*.js';
    const expectedNodeCount = 1;

    const results = processDocCoverage({ sourceGlob: [sourcePath] });

    const totalNodeCount = Object.values(results).reduce(
      (acc, node) => acc + node.nodesCount,
      0,
    );

    expect(totalNodeCount).toBe(expectedNodeCount);
  });

  it('should count total nodes from Javascript and TypeScript files correctly', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/**/*.{js,ts}';
    const expectedNodeCount = 9;

    const results = processDocCoverage({ sourceGlob: [sourcePath] });

    const totalNodeCount = Object.values(results).reduce(
      (acc, node) => acc + node.nodesCount,
      0,
    );

    expect(totalNodeCount).toBe(expectedNodeCount);
  });

  it('respect `sourceGlob` and only include matching files', () => {
    const sourcePath =
      'packages/plugin-doc-coverage/mocks/fixtures/angular/**/*.ts';
    const expectedNodeCount = 7;

    const results = processDocCoverage({
      sourceGlob: [sourcePath, '!**/*.spec.ts', '!**/*.test.ts'],
    });

    const totalNodeCount = Object.values(results).reduce(
      (acc, node) => acc + node.nodesCount,
      0,
    );

    expect(totalNodeCount).toBe(expectedNodeCount);
  });
});
