import docCoveragePlugin from '@code-pushup/doc-coverage-plugin';

export default {
  plugins: [await docCoveragePlugin({ sourceGlob: ['**/*.ts'] })],
};
