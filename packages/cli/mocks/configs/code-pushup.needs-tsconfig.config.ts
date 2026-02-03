// the point is to test runtime import which requires tsconfig for path aliases
// eslint-disable-next-line import/no-unresolved
import customPlugin from '@example/custom-plugin';

const config = {
  plugins: [customPlugin],
};

export default config;
