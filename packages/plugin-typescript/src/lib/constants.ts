export const TYPESCRIPT_PLUGIN_SLUG = 'typescript';

export const SUPPORTED_TS_ERROR_CODES = {
  2322: 'strict-type-checks', // Type 'X' is not assignable to type 'Y'
  2345: 'strict-function-types', // Argument of type 'X' is not assignable to parameter of type 'Y'
  2366: 'strict-missing-return', // Function lacks ending return statement and return type does not include 'undefined'
  2531: 'strict-possibly-null', // Object is possibly 'null'
  2532: 'strict-possibly-undefined', // Object is possibly 'undefined'
  2564: 'strict-property-initialization', // Property 'x' has no initializer and is not definitely assigned
  7006: 'no-implicit-any', // Parameter 'x' implicitly has an 'any' type
  7031: 'strict-bind-call-apply', // Binding element 'x' implicitly has an 'any' type
} as const;

export const BASIC_CHECKES = [2322, 2345, 2531];

export const PRESET_STRICT_CODES = [1, 2, 3, 4, 5];

export const PRESET_NULLISH_YADADADA = [6, 7, 8, 9, 10];
