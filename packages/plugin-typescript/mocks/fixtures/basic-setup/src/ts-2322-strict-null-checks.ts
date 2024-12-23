/**
 * Error Code: 2322
 * Compiler Option: strictNullChecks
 * Description: Type 'number' is not assignable to type 'string'.
 */
function strictNullChecksError() {
  let value: string = 42; // Error: Type 'number' is not assignable to type 'string'
}
