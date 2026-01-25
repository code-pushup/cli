export type ItemOrArray<T> = T | T[];

export type ExtractArray<T> = T extends unknown[] ? T : never;

export type ExecutableCode = {
  fileImports: ItemOrArray<string>;
  codeStrings: ItemOrArray<string>;
};

export type ExtractArrays<T extends Record<string, unknown>> = {
  [K in keyof T]: ExtractArray<T[K]>;
};
