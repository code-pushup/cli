import { processDocCoverage } from './doc-processer.js';

describe('processDocCoverage', () => {
  const sourcePath =
    'packages/plugin-doc-coverage/mocks/fixtures/angular/**/*.ts';

  it('should count total nodes from TypeScript files correctly', () => {
    const expectedNodeCount = 8;

    const results = processDocCoverage({ sourceGlob: [sourcePath] });

    const totalNodeCount = Object.values(results).reduce(
      (acc, node) => acc + node.nodesCount,
      0,
    );

    expect(totalNodeCount).toBe(expectedNodeCount);
  });

  it('respect `sourceGlob` and only include matching files', () => {
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
