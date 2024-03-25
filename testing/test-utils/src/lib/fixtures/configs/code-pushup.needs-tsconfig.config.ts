// the point is to test runtime import which relies on alias defined in tsconfig.json "paths"
// non-type import from '@example/custom-plugin' wouldn't work without --tsconfig
import customPlugin from '@example/custom-plugin';

const config = {
  plugins: [customPlugin],
};

export default config;
