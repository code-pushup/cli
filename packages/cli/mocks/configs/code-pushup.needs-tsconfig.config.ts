// the point is to test runtime import which requires tsconfig for path aliases

/* eslint-disable import/no-unresolved */
// @ts-expect-error - test tsconfig paths missing in config
import customPlugin from '@example/custom-plugin';

/* eslint-enable import/no-unresolved */
const config = {
  plugins: [customPlugin],
};

export default config;
