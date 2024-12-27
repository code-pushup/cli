/* eslint-disable @typescript-eslint/no-magic-numbers, unicorn/numeric-separators-style */

export const GROUPS_DESCRIPTIONS = {
  languageAndEnvironment:
    'Configuration options for TypeScript language features and runtime environment, including decorators, JSX support, target ECMAScript version, and class field behaviors',
  interopConstraints:
    'Settings that control how TypeScript interoperates with other JavaScript code, including module imports/exports and case sensitivity rules',
  watchOptions:
    'Configuration for TypeScript watch mode behavior, including file watching strategies and dependency tracking',
  projectReferences:
    'Options for managing TypeScript project references, composite projects, and build optimization settings',
  moduleResolution:
    'Settings that control how TypeScript finds and resolves module imports, including Node.js resolution, package.json exports/imports, and module syntax handling',
  typeCheckingBehavior:
    'Configuration for TypeScript type checking strictness and error reporting, including property access rules and method override checking',
  controlFlowOptions:
    'Settings that affect code flow analysis, including handling of unreachable code, unused labels, switch statements, and async/generator functions',
  strictChecks:
    'Strict type checking options that enable additional compile-time verifications, including null checks, implicit any/this, and function type checking',
  buildEmitOptions:
    'Configuration options that control TypeScript output generation, including whether to emit files, how to handle comments and declarations, and settings for output optimization and compatibility helpers',
};

/**
 *  Strict grouping: https://github.com/microsoft/TypeScript/blob/56a08250f3516b3f5bc120d6c7ab4450a9a69352/src/compiler/utilities.ts Line 9113
 *      noImplicitThis: {
 *         dependencies: ["strict"],
 *         computeValue: compilerOptions => {
 *             return getStrictOptionValue(compilerOptions, "noImplicitThis");
 *         },
 *     },
 *  Line 9262
 *  export function getStrictOptionValue(compilerOptions: CompilerOptions, flag: StrictOptionName): boolean {
 *     return compilerOptions[flag] === undefined ? !!compilerOptions.strict : !!compilerOptions[flag];
 * }
 * https://github.com/microsoft/TypeScript/blob/56a08250f3516b3f5bc120d6c7ab4450a9a69352/src/compiler/utilities.ts#L9262
 */

/** This is the list of error codes that can be triggered by the TypeScript compiler.
 * It's divided into: category -> compiler option -> error codes (that might trigger)
 */
export const TS_ERROR_CODES = {
  languageAndEnvironment: {
    experimentalDecorators: [1240, 1241, 1242, 1243, 1244, 1270, 1271, 1272],
    emitDecoratorMetadata: [1240, 1241, 1272],
    jsx: [1341, 18007, 18034, 18035, 18053],
    jsxFactory: [17004, 17001],
    jsxFragmentFactory: [17002, 17003],
    jsxImportSource: [17004],
    lib: [2318, 2432],
    moduleDetection: [1280],
    noLib: [2318, 2354],
    reactNamespace: [2503, 2504],
    target: [2322, 2339, 2459],
    useDefineForClassFields: [2729, 2730],
  } as const,
  interopConstraints: {
    allowSyntheticDefaultImports: [1192, 1259],
    esModuleInterop: [1202, 1203, 1204, 1259],
    forceConsistentCasingInFileNames: [1149, 1261],
    isolatedModules: [18055, 18056, 18057],
    preserveSymlinks: [1421],
  } as const,
  /*
  watchOptions: {
    assumeChangesOnlyAffectDirectDependencies: [6373],
    preserveWatchOutput: [6379], // This affects watch mode behavior rather than emitting errors
    watchDirectory: [6378],
    watchFile: [6377],
  } as const,
  projectReferences: {
    composite: [6372],
    disableReferencedProjectLoad: [6371],
    disableSolutionSearching: [6370],
    disableSourceOfProjectReferenceRedirect: [6374],
  } as const,*/
  moduleResolution: {
    moduleResolution: [2307, 1479, 2792],
    customConditions: [1378],
    resolvePackageJsonExports: [1343],
    resolvePackageJsonImports: [1344],
    verbatimModuleSyntax: [1286, 1287, 1288, 1484, 1485],
  } as const,
  typeCheckingBehavior: {
    // noErrorTruncation: [2322, 2345], // This affects error message display rather than triggering specific errors
    exactOptionalPropertyTypes: [2775],
    noUncheckedIndexedAccess: [7061, 2536],
    noImplicitOverride: [4114, 4113],
    noPropertyAccessFromIndexSignature: [4111],
  } as const,
  controlFlowOptions: {
    allowUnreachableCode: [7027],
    noImplicitReturns: [7030, 1064],
    noFallthroughCasesInSwitch: [7029],
  } as const,
  buildEmitOptions: {
    noEmit: [6059],
    noEmitHelpers: [2343],
    noEmitOnError: [2318, 2354],
    preserveConstEnums: [2748],
    removeComments: [2728],
    stripInternal: [2680],
    emitBOM: [2427],
    importHelpers: [2343, 2344],
    downlevelIteration: [2569],
    emitDeclarationOnly: [5069],
  } as const,
  strict: {
    noImplicitAny: [
      7005, 7006, 7008, 7009, 7010, 7011, 7015, 7016, 7017, 7018, 7019, 7031,
      7032, 7033,
    ],
    noImplicitThis: [2683, 2674],
    alwaysStrict: [1100, 1101, 1102, 1212, 1213, 1214, 1215, 1250, 1251, 1252],
    strictBuiltinIteratorReturn: [1065],
    strictPropertyInitialization: [2564, 2565, 1263, 1264],
    strictNullChecks: [2531, 2532, 2533, 2722, 2721, 18047, 18048, 18049],
    strictBindCallApply: [2677, 2345, 2769],
    strictFunctionTypes: [2344, 2322, 2345, 2411],
  } as const,
} as const;
