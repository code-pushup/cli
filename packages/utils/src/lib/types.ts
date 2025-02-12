export type ExcludeNullableProps<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

export type ItemOrArray<T> = T | T[];

export type ExtractArray<T> = T extends unknown[] ? T : never;

export type ExtractArrays<T extends Record<string, unknown>> = {
  [K in keyof T]: ExtractArray<T[K]>;
};

export type WithRequired<T, K extends keyof T> = Prettify<
  Omit<T, K> & Required<Pick<T, K>>
>;

export type Prettify<T> = { [K in keyof T]: T[K] };

export type CamelCaseToKebabCase<T extends string> =
  T extends `${infer First}${infer Rest}`
    ? Rest extends Uncapitalize<Rest>
      ? `${Lowercase<First>}${CamelCaseToKebabCase<Rest>}`
      : `${Lowercase<First>}-${CamelCaseToKebabCase<Rest>}`
    : T;

export type KebabCaseToCamelCase<T extends string> =
  T extends `${infer First}-${infer Rest}`
    ? `${First}${Capitalize<KebabCaseToCamelCase<Rest>>}`
    : T;
