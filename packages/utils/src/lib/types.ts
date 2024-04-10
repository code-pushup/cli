export type ExcludeNullFromPropertyTypes<T> = {
  [P in keyof T]: Exclude<T[P], null>;
};
