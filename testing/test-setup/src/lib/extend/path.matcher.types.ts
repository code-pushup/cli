// types/vitest.d.ts
import 'vitest';

export type CustomPathMatchers<R = unknown> = {
  toMatchPath: (path: string) => void;
  toStartWithPath: (path: string) => void;
  toContainPath: (path: string) => void;
  toEndWithPath: (path: string) => void;
};

export type CustomAsymmetricPathMatchers<R = unknown> = {
  pathToMatch: (path: string) => void;
  pathToStartWith: (path: string) => void;
  pathToContain: (path: string) => void;
  pathToEndWith: (path: string) => void;
};
