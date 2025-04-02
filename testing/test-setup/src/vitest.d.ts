import type { CustomMarkdownTableMatchers } from './lib/extend/markdown-table.matcher.js';
import type {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
} from './lib/extend/path.matcher.js';
import type { CustomUiLoggerMatchers } from './lib/extend/ui-logger.matcher.js';

declare module 'vitest' {
  interface Assertion
    extends CustomPathMatchers,
      CustomUiLoggerMatchers,
      CustomMarkdownTableMatchers {}
  interface AsymmetricMatchersContaining extends CustomAsymmetricPathMatchers {}
}
