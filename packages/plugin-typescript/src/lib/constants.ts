export const TYPESCRIPT_PLUGIN_SLUG = 'typescript';

/* eslint-disable @typescript-eslint/no-magic-numbers */
export const SUPPORTED_TS_ERROR_CODES = {
  2322: 'strict-type-checks', // Type 'X' is not assignable to type 'Y'
  2345: 'strict-function-types', // Argument of type 'X' is not assignable to parameter of type 'Y'
  2366: 'strict-missing-return', // Function lacks ending return statement and return type does not include 'undefined'
  2531: 'strict-possibly-null', // Object is possibly 'null'
  2532: 'strict-possibly-undefined', // Object is possibly 'undefined'
  2564: 'strict-property-initialization', // Property 'x' has no initializer and is not definitely assigned
  7006: 'no-implicit-any', // Parameter 'x' implicitly has an 'any' type
  7031: 'strict-bind-call-apply', // Binding element 'x' implicitly has an 'any' type

  1002: 'unterminated-string-literal',
  1003: 'identifier-expected',
  1005: 'token-expected',
  1006: 'self-reference-error',
  1007: 'mismatched-token',
  1009: 'trailing-comma-not-allowed',
  1010: 'end-comment-expected',
  1011: 'argument-expected',
  1012: 'unexpected-token',
  1013: 'no-trailing-comma',
  1014: 'rest-param-must-be-last',
  1015: 'invalid-param-initializer',
  1016: 'optional-param-order-error',
  1017: 'invalid-rest-in-index-signature',
  1018: 'no-access-modifier-in-index-signature',
  1019: 'no-optional-in-index-signature',
  1020: 'no-initializer-in-index-signature',
  1021: 'index-signature-type-required',
  1022: 'index-param-type-required',
  1024: 'readonly-only-on-properties',
  1025: 'no-trailing-comma-in-index-signature',
  1028: 'duplicate-access-modifier',
  1029: 'modifier-order-error',
  1030: 'duplicate-modifier',
  1031: 'invalid-modifier-placement',
  1034: 'invalid-super-usage',
  1035: 'quoted-names-in-modules-only',
  1036: 'no-statements-in-ambient',
  1038: 'declare-not-in-ambient',
  1039: 'no-initializer-in-ambient',
  1040: 'invalid-modifier-in-ambient',
  1042: 'invalid-modifier-here',
  1044: 'invalid-modifier-on-module',
  1046: 'invalid-declaration-in-dts',
  1047: 'rest-param-not-optional',
  1048: 'rest-param-no-initializer',
  1049: 'setter-one-param-only',
  1051: 'setter-no-optional-param',
  1052: 'setter-no-initializer',
  1053: 'setter-no-rest-param',
  1054: 'getter-no-params',
  1055: 'invalid-async-return-type',
  1056: 'accessors-require-es5',
  1058: 'invalid-async-promise',
  1059: 'promise-requires-then',
  1060: 'promise-then-callback-required',
  1061: 'enum-initializer-required',
  1062: 'recursive-promise-reference',
  1063: 'export-assignment-error',
  1064: 'async-promise-type-error',
  1066: 'constant-enum-initializer-required',
  1085: 'syntax-error',
  1086: 'no-accessor-in-ambient',
  1089: 'invalid-constructor-modifier',
  1090: 'invalid-param-modifier',
} as const;

export const BASIC_CHECKES = [2322, 2345, 2531];
/* eslint-enable @typescript-eslint/no-magic-numbers */
