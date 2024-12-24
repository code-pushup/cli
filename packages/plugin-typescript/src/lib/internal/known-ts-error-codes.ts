/* eslint-disable @typescript-eslint/no-magic-numbers */
import type {AuditSlug} from '../types.js';

/**
 *   [src/compiler/types.ts](https://github.com/microsoft/TypeScript/blob/56a08250f3516b3f5bc120d6c7ab4450a9a69352/src/compiler/types.ts) -> compilerOptions 7482
 *   [src/compiler/utilities.ts](https://github.com/microsoft/TypeScript/blob/56a08250f3516b3f5bc120d6c7ab4450a9a69352/src/compiler/types.ts)  9125
 */

// Strict checks group
const noImplicitAnyCodes = [7005, 7006, 7008, 7009, 7010, 7011, 7015, 7016, 7017, 7018, 7019, 7031, 7032, 7033];
const noImplicitThisCodes = [2683, 2674];
const alwaysStrictCodes = [1100, 1101, 1102, 1212, 1213, 1214, 1215, 1250, 1251, 1252];
const strictBuiltinIteratorReturn = [1065]; // sussy
const strictPropertyInitializationCodes = [2564, 2565, 1263, 1264];
const strictNullChecksCodes = [2531, 2532, 2533, 2722, 2721, 18047, 18048, 18049];
const strictBindCallApplyCodes = [2677, 2345, 2769];
const strictFunctionTypesCodes = [2344, 2322, 2345, 2411];

// Extras checks group
// Previous groups remain the same...

// Build and Emit Options
const noEmitCodes = [6059];
const noEmitHelpersCodes = [2343];
const noEmitOnErrorCodes = [2318, 2354];
const preserveConstEnumsCodes = [2748];
const removeCommentsCodes = [2728];
const stripInternalCodes = [2680];
const emitBOMCodes = [2427];
const importHelpersCodes = [2343, 2344];
const downlevelIterationCodes = [2569];
const emitDeclarationOnlyCodes = [5069];

// Code Quality
const allowUnreachableCodeCodes = [7027];
const allowUnusedLabelsCodes = [7028];
const noImplicitReturnsInAsyncFunctionsCodes = [7030, 1064];
const noUnusedLabelsCodes = [7028];
const allowUnusedParametersCodes = [6134];
const noFallthroughCasesInSwitchCodes = [7029];
const noImplicitReturnsInGeneratorsCodes = [7030];
const noPropertyAccessFromComputedKeyCodes = [4111];

// Type Checking Behavior
const noErrorTruncationCodes = [2322, 2345]; // This affects error message display rather than triggering specific errors
const exactOptionalPropertyTypesCodes = [2775];
const noFallthroughCasesInSwitchCodes = [7029];
const noUncheckedIndexedAccessCodes = [7061];
const noImplicitOverrideCodes = [4114, 4113];
const noPropertyAccessFromIndexSignatureCodes = [4111];

// Module Resolution
const moduleResolutionNodeCodes = [2307];
const moduleResolutionBundlerCodes = [1479];
const customConditionsCodes = [1378];
const resolvePackageJsonExportsCodes = [1343];
const resolvePackageJsonImportsCodes = [1344];

// Project References
const compositeCodes = [6372];
const disableReferencedProjectLoadCodes = [6371];
const disableSolutionSearchingCodes = [6370];
const disableSourceOfProjectReferenceRedirectCodes = [6374];

// Watch Options
const assumeChangesOnlyAffectDirectDependenciesCodes = [6373];
const preserveWatchOutputCodes = [6379]; // This affects watch mode behavior rather than emitting errors
const watchDirectoryCodes = [6378];
const watchFileCodes = [6377];

// Interop Constraints
const allowSyntheticDefaultImportsCodes = [1192, 1259];
const esModuleInteropCodes = [1202, 1203, 1204, 1259];
const forceConsistentCasingInFileNamesCodes = [1149, 1261];
const isolatedModulesCodes = [18055, 18056, 18057];
const preserveSymlinksCodes = [1421];

// Language and Environment
const experimentalDecorators = [1240, 1241, 1242, 1243, 1244, 1270, 1271, 1272];
const emitDecoratorMetadata = [1240, 1241, 1272];
const jsx = [1341, 18007, 18034, 18035, 18053];
const jsxFactoryCodes = [17004, 17001];
const jsxFragmentFactoryCodes = [17002, 17003];
const jsxImportSourceCodes = [17004];
const libCodes = [2318, 2432];
const moduleDetectionCodes = [1280];
const noLibCodes = [2318, 2354];
const reactNamespaceCodes = [2503, 2504];
const targetCodes = [2322, 2339, 2459];
const useDefineForClassFieldsCodes = [2729, 2730];

const verbatimModuleSyntaxCodes = [1286, 1287, 1288, 1484, 1485];

export const STRICT_CHECKS = {
  'no-implicit-any-codes': noImplicitAnyCodes,
  'no-implicit-this-codes': noImplicitThisCodes,
  'always-strict-codes': alwaysStrictCodes,
  'strict-builtin-iterator-return': strictBuiltinIteratorReturn,
  'strict-property-initialization-codes': strictPropertyInitializationCodes,
  'strict-null-checks-codes': strictNullChecksCodes,
  'strict-bind-call-apply-codes': strictBindCallApplyCodes,
  'strict-function-types-codes': strictFunctionTypesCodes,
}

/*
* # Audits
*
* - strict-checks - group
*   - no-implicit-any-codes - audit
*     - 1240 - issue
*     - 1241 - issue
*     - 1272 - issue
*   - no-implicit-this-codes - audit
*   - always-strict-codes - audit
*   - strict-builtin-iterator-return - audit
*   - strict-property-initialization-codes - audit
**/
// Build Reverse Lookup Map
export const AUDIT_LOOKUP = new Map<number, string>();

for (const [slug, codes] of Object.entries(STRICT_CHECKS)) {
  codes.forEach((code) => AUDIT_LOOKUP.set(code, slug));
}

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

