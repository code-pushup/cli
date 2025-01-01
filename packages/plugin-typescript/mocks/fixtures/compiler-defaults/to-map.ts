



// 7033 - SuppressExcessPropertyErrors: Excessive property in assignment.
const suppressExcessTS7033 = { name: "example", extra: "unexpected" }; // Error 7033

// 7061 - NoUncheckedIndexedAccess: Index signature requires explicit checks.
const noUncheckedIndexedAccessTS7061: string[] = [];
console.log(noUncheckedIndexedAccessTS7061[0]); // Error 7061

// 6054 - Target: File is not part of a compilation unit.
const targetTS6054 = "Example"; // Error 6054

// 6408 - ModuleResolution: Module cannot be resolved with specified paths.
import * as moduleResolutionTS6408 from "non-existent"; // Error 6408

// 7029 - NoFallthroughCasesInSwitch: Case clause may fall through.
function noFallthroughTS7029(value: number) {
  switch (value) {
    case 1:
      console.log("One");
    // Error 7029
    case 2:
      console.log("Two");
  }
}

// 1149 - ForceConsistentCasing: File name casing mismatch.
import { Example } from "./example"; // Error 1149

// 2532 - StrictNullChecks: Object is possibly 'undefined'.
const strictNullChecksTS2532: string = undefined; // Error 2532

// 2324 - Type 'string' is not assignable to type 'number'.
const typeMismatchTS2324: number = "42"; // Error 2324

// 2451 - Cannot redeclare block-scoped variable.
let duplicateVarTS2451 = 10;
let duplicateVarTS2451 = 20; // Error 2451

// 1259 - AllowSyntheticDefaultImports: Cannot find module with default export.
import allowSyntheticDefaultImportsTS1259 from "non-existent"; // Error 1259

// 4113 - NoImplicitOverride: Overrides method from superclass without 'override'.
class OverrideMissingTS4113 extends Base {
  method() {} // Error 4113

// 7012 - NoImplicitAny: Implicit 'any' type in property.
  const noImplicitAnyTS7012 = { name: "example" };
  console.log(noImplicitAnyTS7012.age); // Error 7012

// 5069 - EmitDeclarationOnly: Cannot emit declaration file.
  function emitDeclarationOnlyTS5069() {
    return "example";
  } // Error 5069

// 17002 - JSXFragmentFactory: Missing JSX fragment factory.
  const jsxFragmentTS17002 = <>Fragment</>; // Error 17002

// 2732 - UseDefineForClassFields: Class field requires explicit initializer.
  class UseDefineForClassFieldsTS2732 {
  prop: string; // Error 2732
}

// 18034 - JSXFactory: Missing JSX factory for JSX syntax.
const jsxFactoryTS18034 = <div></div>; // Error 18034

// 1101 - AlwaysStrict: Function is not in strict mode.
function alwaysStrictTS1101() {
  return "example";
} // Error 1101

// 7030 - NoImplicitReturns: Function implicitly returns 'undefined'.
function noImplicitReturnsTS7030(): string {
  if (Math.random() > 0.5) {
    return "example";
  }
} // Error 7030

// 6064 - ModuleSuffixes: Cannot resolve module suffix.
import * as moduleSuffixTS6064 from "./example.js"; // Error 6064

// 1212 - AlwaysStrict: Non-strict JavaScript file.
function nonStrictTS1212() {
  console.log("example");
} // Error 1212

// 6193 - WatchOptions: Unsupported file watcher.
const watchOptionsTS6193 = "Unsupported watcher"; // Error 6193

// 6106 - ModuleResolution: Invalid baseUrl in configuration.
import * as moduleResolutionTS6106 from "./example"; // Error 6106


// 6202 - Composite: File cannot be included in composite project.
const compositeTS6202 = "example"; // Error 6202

// 4111 - NoPropertyAccessFromIndexSignature: Cannot access property from index signature.
const indexAccessTS4111: { [key: string]: string } = {};
console.log(indexAccessTS4111.name); // Error 4111

// 7008 - NoImplicitAny: Implicit 'any' type in destructuring.
const { missing } = {}; // Error 7008
