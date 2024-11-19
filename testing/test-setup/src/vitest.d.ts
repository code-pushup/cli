import {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
} from './lib/extend/path.matcher.types';

declare module 'vitest' {
  type Assertion<T = unknown> = CustomPathMatchers<T>;
  type AsymmetricMatchersContaining = CustomAsymmetricPathMatchers;
}
