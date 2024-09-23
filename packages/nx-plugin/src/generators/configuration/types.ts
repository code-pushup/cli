import type { ItemOrArray } from '@code-pushup/utils';

export type ExecutableCode = {
  fileImports: ItemOrArray<string>;
  codeStrings: ItemOrArray<string>;
};
