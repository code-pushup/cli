/**
 * # Diagnostic Code Ranges and Their Grouping
 *
 * TypeScript diagnostic codes are grouped into ranges based on their source and purpose. Here's how they are categorized:
 *
 * | Code Range | Type                                             | Description                                                               |
 * |------------|---------------------------------|--------------------------------------------------|
 * | 1XXX          | Syntax Errors                                 | Structural issues detected during parsing.            |
 * | 2XXX          | Semantic Errors                            | Type-checking and type-system violations.          |
 * | 3XXX          | Suggestions                                  | Optional improvements (e.g., unused variables).  |
 * | 4XXX          | Declaration & Language Service | Used by editors (e.g., VSCode) for IntelliSense.   |
 * | 5XXX          | Internal Compiler Errors               | Rare, unexpected failures in the compiler.             |
 * | 6XXX          | Configuration/Options Errors      | Issues with `tsconfig.json` or compiler options.    |
 * | 7XXX          | noImplicitAny Errors                     | Issues with commandline compiler options.           |
 *
 * The diagnostic messages are exposed over a undocumented and undiscoverable const names `Diagnostics`.
 * Additional information is derived from [TypeScript's own guidelines on diagnostic code ranges](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines#diagnostic-message-codes)
 *
 */
export const TS_CODE_RANGE_NAMES = {
  '1': 'syntax-errors',
  '2': 'semantic-errors',
  // '3': 'suggestions',
  '4': 'declaration-and-language-service-errors',
  '5': 'internal-errors',
  '6': 'configuration-errors',
  '7': 'no-implicit-any-errors',
  '9': 'unknown-codes',
} as const;
