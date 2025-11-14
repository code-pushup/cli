import type { CustomMatchers as JestExtendedMatchers } from 'jest-extended';
import type { CustomMarkdownTableMatchers } from './lib/extend/markdown-table.matcher.js';
import type {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
} from './lib/extend/path.matcher.js';

declare module 'vitest' {
  interface Assertion
    extends CustomPathMatchers,
      CustomMarkdownTableMatchers,
      JestExtendedMatchers {}

  interface AsymmetricMatchersContaining
    extends CustomAsymmetricPathMatchers,
      JestExtendedMatchers {}

  interface ExpectStatic extends JestExtendedMatchers {}
}
