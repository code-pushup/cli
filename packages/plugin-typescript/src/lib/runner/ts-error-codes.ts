/* eslint-disable @typescript-eslint/no-magic-numbers, unicorn/numeric-separators-style */

// Strict checks group
const noImplicitAny = [7005, 7006, 7008, 7009, 7010, 7011, 7015, 7016, 7017, 7018, 7019, 7031, 7032, 7033];
const noImplicitThis = [2683, 2674];
const alwaysStrict = [1100, 1101, 1102, 1212, 1213, 1214, 1215, 1250, 1251, 1252];
const strictBuiltinIteratorReturn = [1065];
const strictPropertyInitialization = [2564, 2565, 1263, 1264];
const strictNullChecks = [2531, 2532, 2533, 2722, 2721, 18047, 18048, 18049];
const strictBindCallApply = [2677, 2345, 2769];
const strictFunctionTypes = [2344, 2322, 2345, 2411];

export const STRICT_CHECKS = {
  'no-implicit-any': noImplicitAny,
  'no-implicit-this': noImplicitThis,
  'always-strict': alwaysStrict,
  'strict-builtin-iterator-return': strictBuiltinIteratorReturn,
  'strict-property-initialization': strictPropertyInitialization,
  'strict-null-checks': strictNullChecks,
  'strict-bind-call-apply': strictBindCallApply,
  'strict-function-types': strictFunctionTypes,
}

// Build and Emit Options
const noEmit = [6059];
const noEmitHelpers = [2343];
const noEmitOnError = [2318, 2354];
const preserveConstEnums = [2748];
const removeComments = [2728];
const stripInternal = [2680];
const emitBOM = [2427];
const importHelpers = [2343, 2344];
const downlevelIteration = [2569];
const emitDeclarationOnly = [5069];

export const BUILD_EMIT_OPTIONS = {
  'no-emit': noEmit,
  'no-emit-helpers': noEmitHelpers,
  'no-emit-on-error': noEmitOnError,
  'preserve-const-enums': preserveConstEnums,
  'remove-comments': removeComments,
  'strip-internal': stripInternal,
  'emit-bom': emitBOM,
  'import-helpers': importHelpers,
  'downlevel-iteration': downlevelIteration,
  'emit-declaration-only': emitDeclarationOnly,
};

// Code Quality
const allowUnreachableCode = [7027];
const allowUnusedLabels = [7028];
const noImplicitReturnsInAsyncFunctions = [7030, 1064];
const noUnusedLabels = [7028];
const allowUnusedParameters = [6134];
const noFallthroughCasesInSwitch = [7029];
const noImplicitReturnsInGenerators = [7030];
const noPropertyAccessFromComputedKey = [4111];

// Grouped Record for Control Flow and Code Behavior
export const CONTROL_FLOW_OPTIONS = {
  'allow-unreachable-code': allowUnreachableCode,
  'allow-unused-labels': allowUnusedLabels,
  'no-unused-labels': noUnusedLabels,
  'no-implicit-returns-in-async-functions': noImplicitReturnsInAsyncFunctions,
  'allow-unused-parameters': allowUnusedParameters,
  'no-fallthrough-cases-in-switch': noFallthroughCasesInSwitch,
  'no-implicit-returns-in-generators': noImplicitReturnsInGenerators,
  'no-property-access-from-computed-key': noPropertyAccessFromComputedKey,
};

// Type Checking Behavior
const noErrorTruncation = [2322, 2345]; // This affects error message display rather than triggering specific errors
const exactOptionalPropertyTypes = [2775];
const noUncheckedIndexedAccess = [7061];
const noImplicitOverride = [4114, 4113];
const noPropertyAccessFromIndexSignature = [4111];

export const TYPE_CHECKING_BEHAVIOR = {
  'no-error-truncation': noErrorTruncation,
  'exact-optional-property-types': exactOptionalPropertyTypes,
  'no-unchecked-indexed-access': noUncheckedIndexedAccess,
  'no-implicit-override': noImplicitOverride,
  'no-property-access-from-index-signature': noPropertyAccessFromIndexSignature,
};

// Module Resolution
const moduleResolutionNode = [2307];
const moduleResolutionBundler = [1479];
const customConditions = [1378];
const resolvePackageJsonExports = [1343];
const resolvePackageJsonImports = [1344];
const verbatimModuleSyntax = [1286, 1287, 1288, 1484, 1485];

export const MODULE_RESOLUTION = {
  'module-resolution-node': moduleResolutionNode,
  'module-resolution-bundler': moduleResolutionBundler,
  'custom-conditions': customConditions,
  'resolve-package-json-exports': resolvePackageJsonExports,
  'resolve-package-json-imports': resolvePackageJsonImports,
  'verbatim-module-syntax': verbatimModuleSyntax,
};

// Project References
const composite = [6372];
const disableReferencedProjectLoad = [6371];
const disableSolutionSearching = [6370];
const disableSourceOfProjectReferenceRedirect = [6374];

export const PROJECT_REFERENCES = {
  'composite': composite,
  'disable-referenced-project-load': disableReferencedProjectLoad,
  'disable-solution-searching': disableSolutionSearching,
  'disable-source-of-project-reference-redirect': disableSourceOfProjectReferenceRedirect,
};

// Watch Options
const assumeChangesOnlyAffectDirectDependencies = [6373];
const preserveWatchOutput = [6379]; // This affects watch mode behavior rather than emitting errors
const watchDirectory = [6378];
const watchFile = [6377];

export const WATCH_OPTIONS = {
  'assume-changes-only-affect-direct-dependencies': assumeChangesOnlyAffectDirectDependencies,
  'preserve-watch-output': preserveWatchOutput,
  'watch-directory': watchDirectory,
  'watch-file': watchFile,
};

// Interop Constraints
const allowSyntheticDefaultImports = [1192, 1259];
const esModuleInterop = [1202, 1203, 1204, 1259];
const forceConsistentCasingInFileNames = [1149, 1261];
const isolatedModules = [18055, 18056, 18057];
const preserveSymlinks = [1421];

export const INTEROP_CONSTRAINTS = {
  'allow-synthetic-default-imports-codes': allowSyntheticDefaultImports,
  'es-module-interop-codes': esModuleInterop,
  'force-consistent-casing-in-file-names-codes': forceConsistentCasingInFileNames,
  'isolated-modules-codes': isolatedModules,
  'preserve-symlinks-codes': preserveSymlinks,
};

// Language and Environment
const experimentalDecorators = [1240, 1241, 1242, 1243, 1244, 1270, 1271, 1272];
const emitDecoratorMetadata = [1240, 1241, 1272];
const jsx = [1341, 18007, 18034, 18035, 18053];
const jsxFactory = [17004, 17001];
const jsxFragmentFactory = [17002, 17003];
const jsxImportSource = [17004];
const lib = [2318, 2432];
const moduleDetection = [1280];
const noLib = [2318, 2354];
const reactNamespace = [2503, 2504];
const target = [2322, 2339, 2459];
const useDefineForClassFields = [2729, 2730];

export const LANGUAGE_ENVIRONMENT_OPTIONS = {
  'experimental-decorators': experimentalDecorators,
  'emit-decorator-metadata': emitDecoratorMetadata,
  'jsx': jsx,
  'jsx-factory': jsxFactory,
  'jsx-fragment-factory': jsxFragmentFactory,
  'jsx-import-source': jsxImportSource,
  'lib': lib,
  'module-detection': moduleDetection,
  'no-lib': noLib,
  'react-namespace': reactNamespace,
  'target': target,
  'use-define-for-class-fields': useDefineForClassFields,
};
