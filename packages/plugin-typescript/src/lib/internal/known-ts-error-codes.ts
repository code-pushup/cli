
/* eslint-disable @typescript-eslint/no-magic-numbers */
import type {AuditSlug} from "../types.js";

export const SUPPORTED_TS_ERROR_CODES = {
  2322: 'strict-type-checks-2322', // Type 'X' is not assignable to type 'Y'
  2345: 'strict-function-types-2345', // Argument of type 'X' is not assignable to parameter of type 'Y'
  2366: 'strict-missing-return-2366', // Function lacks ending return statement and return type does not include 'undefined'
  2531: 'strict-possibly-null-2531', // Object is possibly 'null'
  2532: 'strict-possibly-undefined-2532', // Object is possibly 'undefined'
  2564: 'strict-property-initialization-2564', // Property 'x' has no initializer and is not definitely assigned
  7006: 'no-implicit-any-7006', // Parameter 'x' implicitly has an 'any' type
  7031: 'strict-bind-call-apply-7031', // Binding element 'x' implicitly has an 'any' type

  1002: 'unterminated-string-literal-1002',
  1003: 'identifier-expected-1003',
  1005: 'token-expected-1005',
  1006: 'self-reference-error-1006',
  1007: 'mismatched-token-1007',
  1009: 'trailing-comma-not-allowed-1009',
  1010: 'end-comment-expected-1010',
  1011: 'argument-expected-1011',
  1012: 'unexpected-token-1012',
  1013: 'no-trailing-comma-1013',
  1014: 'rest-param-must-be-last-1014',
  1015: 'invalid-param-initializer-1015',
  1016: 'optional-param-order-error-1016',
  1017: 'invalid-rest-in-index-signature-1017',
  1018: 'no-access-modifier-in-index-signature-1018',
  1019: 'no-optional-in-index-signature-1019',
  1020: 'no-initializer-in-index-signature-1020',
  1021: 'index-signature-type-required-1021',
  1022: 'index-param-type-required-1022',
  1024: 'readonly-only-on-properties-1024',
  1025: 'no-trailing-comma-in-index-signature-1025',
  1028: 'duplicate-access-modifier-1028',
  1029: 'modifier-order-error-1029',
  1030: 'duplicate-modifier-1030',
  1031: 'invalid-modifier-placement-1031',
  1034: 'invalid-super-usage-1034',
  1035: 'quoted-names-in-modules-only-1035',
  1036: 'no-statements-in-ambient-1036',
  1038: 'declare-not-in-ambient-1038',
  1039: 'no-initializer-in-ambient-1039',
  1040: 'invalid-modifier-in-ambient-1040',
  1042: 'invalid-modifier-here-1042',
  1044: 'invalid-modifier-on-module-1044',
  1046: 'invalid-declaration-in-dts-1046',
  1047: 'rest-param-not-optional-1047',
  1048: 'rest-param-no-initializer-1048',
  1049: 'setter-one-param-only-1049',
  1051: 'setter-no-optional-param-1051',
  1052: 'setter-no-initializer-1052',
  1053: 'setter-no-rest-param-1053',
  1054: 'getter-no-params-1054',
  1055: 'invalid-async-return-type-1055',
  1056: 'accessors-require-es5-1056',
  1058: 'invalid-async-promise-1058',
  1059: 'promise-requires-then-1059',
  1060: 'promise-then-callback-required-1060',
  1061: 'enum-initializer-required-1061',
  1062: 'recursive-promise-reference-1062',
  1063: 'export-assignment-error-1063',
  1064: 'async-promise-type-error-1064',
  1066: 'constant-enum-initializer-required-1066',
  1089: 'invalid-constructor-modifier-1089',
  1090: 'invalid-param-modifier-1090',
} as const satisfies Record<string, AuditSlug>;
