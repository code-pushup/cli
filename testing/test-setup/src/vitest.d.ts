/* eslint-disable @typescript-eslint/consistent-type-definitions,@typescript-eslint/no-empty-interface */
import type {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
} from './lib/extend/path.matcher.js';

declare module 'vitest' {
  interface Assertion extends CustomPathMatchers {}
  interface AsymmetricMatchersContaining extends CustomAsymmetricPathMatchers {}
}
