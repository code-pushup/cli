import type {
  CustomAsymmetricPathMatchers,
  CustomPathMatchers,
} from './lib/extend/path.matcher';

declare module 'vitest' {
  type Assertion<T = unknown> = CustomPathMatchers<T>;
  type AsymmetricMatchersContaining = CustomAsymmetricPathMatchers<T>;
}
