import type { CustomMatchers as JestExtendedMatchers } from 'jest-extended';
import type { CustomMarkdownTableMatchers } from './lib/extend/markdown-table.matcher.js';
import type {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
  FsStructure,
} from './lib/extend/path.matcher.js';

declare module 'vitest' {
  interface Assertion
    extends CustomPathMatchers,
      CustomMarkdownTableMatchers,
      JestExtendedMatchers {
    fsMatchesStructure: (structure: FsStructure) => Promise<void>;
  }

  interface AsymmetricMatchersContaining
    extends CustomAsymmetricPathMatchers,
      JestExtendedMatchers {}

  interface ExpectStatic extends JestExtendedMatchers {}
}

// Export types for use in tests
export type { FsStructure } from './lib/extend/path.matcher.js';
export { fsMatcherKey } from './lib/extend/path.matcher.js';
