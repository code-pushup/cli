// types/vitest.d.ts
import 'vitest';

declare module 'vitest' {
  type Assertion<T = any> = {
    toMatchPath(path: string): void;
    toStartWithPath(path: string): void;
    toContainPath(path: string): void;
    toEndWithPath(path: string): void;
  };
}
