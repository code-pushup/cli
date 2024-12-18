import { processDocCoverage } from './doc-processer';

describe('docProcesser', () => {
  it('should successfully get documentation coverage', () => {
    const results = processDocCoverage(
      'packages/plugin-doc-coverage/mocks/**/*.ts',
    );
    console.log(results);
    expect(results).toBeDefined();
    expect(results.currentCoverage).toBe(60);
    expect(results.coverageByType).toEqual({
      functions: 50,
      variables: 33.33,
      classes: 0,
      methods: 100,
      properties: 100,
      interfaces: 100,
      types: 100,
    });
  });
});
