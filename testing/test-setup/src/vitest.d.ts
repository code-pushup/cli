/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
} from './lib/extend/path.matcher.js';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Assertion extends CustomPathMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomAsymmetricPathMatchers {}
}
/* eslint-enable @typescript-eslint/consistent-type-definitions */
