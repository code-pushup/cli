/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
} from './lib/extend/path.matcher.js';
import type { CustomUiLoggerMatchers } from './lib/extend/ui-logger.matcher.js';

declare module 'vitest' {
  interface Assertion extends CustomPathMatchers, CustomUiLoggerMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomAsymmetricPathMatchers {}
}
/* eslint-enable @typescript-eslint/consistent-type-definitions */
