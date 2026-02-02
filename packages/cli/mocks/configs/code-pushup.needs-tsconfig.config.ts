// the point is to test runtime import which requires tsconfig for path aliases
import customPlugin from '@example/custom-plugin';

const config = {
  plugins: [customPlugin],
};

export default config;
