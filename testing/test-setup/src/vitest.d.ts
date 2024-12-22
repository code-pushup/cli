/* eslint-disable @typescript-eslint/consistent-type-definitions,@typescript-eslint/no-empty-interface */
import type {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
} from './lib/extend/path.matcher.js';

declare module 'vitest' {
  // eslint-disable @typescript-eslint/no-empty-object-type
  interface Assertion extends CustomPathMatchers {}
  // eslint-disable @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends CustomAsymmetricPathMatchers {}
}
