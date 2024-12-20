import { processDocCoverage } from './doc-processer.js';

describe('processDocCoverage', () => {
  it('should succesfully get the right number of ts files', () => {
    const results = processDocCoverage({
      sourceGlob: [
        'packages/plugin-doc-coverage/mocks/fixtures/angular/**/*.ts',
      ],
    });
    expect(results).toMatchSnapshot();
  });

  it('should succesfully get the right number of ts files and not include spec files', () => {
    const results = processDocCoverage({
      sourceGlob: [
        'packages/plugin-doc-coverage/mocks/fixtures/angular/**/*.ts',
        '!**/*.spec.ts',
        '!**/*.test.ts',
      ],
    });
    expect(results).toMatchSnapshot();
  });
});
