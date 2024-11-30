// types/vitest.d.ts
import 'vitest';

export type CustomPathMatchers<R = string> = {
  toMatchPath: (path: R) => void;
  toStartWithPath: (path: R) => void;
  toContainPath: (path: R) => void;
  toEndWithPath: (path: R) => void;
};

export type CustomAsymmetricPathMatchers<R = string> = {
  pathToMatch: (path: R) => void;
  pathToStartWith: (path: R) => void;
  pathToContain: (path: R) => void;
  pathToEndWith: (path: R) => void;
};
