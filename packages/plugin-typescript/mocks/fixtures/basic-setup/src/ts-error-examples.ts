// ts-error-examples.ts

/**
 * Error Code: 2322
 * Compiler Option: strictNullChecks
 * Description: Type 'number' is not assignable to type 'string'.
 */
function strictNullChecksError() {
  let value: string = 42; // Error: Type 'number' is not assignable to type 'string'
}

/**
 * Error Code: 2345
 * Compiler Option: strictFunctionTypes
 * Description: Argument type is not assignable to parameter type.
 */
function strictFunctionTypesError() {
  type Func = (arg: number) => void;
  const fn: Func = (arg: string) => {}; // Error: Type 'string' is not assignable to type 'number'
}

/**
 * Error Code: 6133
 * Compiler Option: noUnusedParameters
 * Description: 'param' is declared but its value is never read.
 */
function noUnusedParametersError(param: string) { }

/**
 * Error Code: 7006
 * Compiler Option: noImplicitAny
 * Description: Parameter 'param' implicitly has an 'any' type.
 */
function noImplicitAnyError(param) {
  console.log(param);
}

/**
 * Error Code: 6053
 * Compiler Option: include, files
 * Description: File not found.
 */
// This error happens when a file specified in 'files' or 'include' does not exist.

/**
 * Error Code: 7027
 * Compiler Option: strictPropertyInitialization
 * Description: Property has no initializer and is not definitely assigned in the constructor.
 */
class strictPropertyInitializationError {
  property: string; // Error: Property 'property' has no initializer
}

/**
 * Error Code: 2307
 * Compiler Option: moduleResolution
 * Description: Cannot find module.
 */
import { nonExistentModule } from './non-existent';

/**
 * Error Code: 2820
 * Compiler Option: baseUrl
 * Description: Base URL configuration issue.
 */
// Occurs when imports fail due to incorrect baseUrl configuration.

/**
 * Error Code: 2821
 * Compiler Option: paths
 * Description: Path alias mismatch.
 */
import aliasModule from '@alias/non-existent';

/**
 * Error Code: 1375
 * Compiler Option: esModuleInterop
 * Description: Import assignment error.
 */
import fs = require('fs'); // Might trigger if esModuleInterop is false.

/**
 * Error Code: 1206
 * Compiler Option: target
 * Description: Target version mismatch.
 */
let bigIntValue: bigint = 10n; // Might fail in lower target versions.

/**
 * Error Code: 5009
 * Compiler Option: outDir
 * Description: Output directory issue.
 */
// Occurs if 'outDir' conflicts with project structure.

/**
 * Error Code: 5055
 * Compiler Option: rootDir
 * Description: Root directory mismatch.
 */
// Occurs if files are outside the 'rootDir' path.

/**
 * Error Code: 1371
 * Compiler Option: resolveJsonModule
 * Description: JSON module resolution issue.
 */
import jsonData from './data.json';
