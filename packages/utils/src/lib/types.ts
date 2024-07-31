export type ExcludeNullFromPropertyTypes<T> = {
  [P in keyof T]: Exclude<T[P], null>;
};

export type ItemOrArray<T> = T | T[];

export type ExtractArray<T> = T extends Array<unknown> ? T : never;

export type ExtractArrays<T extends Record<string, unknown>> = {
  [K in keyof T]: ExtractArray<T[K]>;
};
