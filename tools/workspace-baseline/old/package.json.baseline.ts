import { createJsonBaselineTyped } from '../src/lib/baseline/baseline.json';
import { object } from '../src/lib/baseline/baseline.json';

type PackageJson = {
  name?: string;
  version?: string;
  description?: string;
  license?: string;
  author?: string;
  type?: 'module' | 'commonjs';
  main?: string;
  module?: string;
  types?: string;
  exports?: Record<string, unknown>;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  repository?: {
    type?: string;
    url?: string;
  };
  keywords?: string[];
  bugs?: {
    url?: string;
  };
  homepage?: string;
};

/**
 * Baseline for package.json files.
 *
 * Standardizes:
 * - Package metadata (license, version, etc.)
 * - Module type configuration
 * - Common scripts
 * - Dependencies structure
 */
const packageJsonBase = createJsonBaselineTyped<PackageJson>({
  matcher: ['package.json'],
  fileName: 'package.json',
  baseline: root =>
    root.set({
      license: 'MIT',
    }),
});

export default packageJsonBase;
