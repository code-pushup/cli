// types/vitest.d.ts
import 'vitest';
import {describe, expect} from "vitest";

interface CustomMatchers<R = unknown> {
  toMatchPath(path: string): void;
  toStartWithPath(path: string): void;
  toContainPath(path: string): void;
  toEndWithPath(path: string): void;
}

interface CustomAsymmetricMatchers<R = unknown> {
  pathToMatch(path: string): void;
  pathToStartWith(path: string): void;
  pathToContain(path: string): void;
  pathToEndWith(path: string): void;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {};
  interface AsymmetricMatchersContaining extends CustomAsymmetricMatchers {}
}
