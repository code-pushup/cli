import { describe, expect, it } from 'vitest';
import { parseTsConfigJson } from './generate-ts-config.js';

describe('parseTsConfigJson', () => {
  it('should work', async () => {
    const testContent = `{
  "compilerOptions": {
    /* Visit https://aka.ms/tsconfig to read more about this file */

    /* Projects */
    // "incremental": true,                              /* Save .tsbuildinfo files to allow for incremental compilation of projects. */
    // "composite": true,                                /* Enable constraints that allow a TypeScript project to be used with project references. */
    // "tsBuildInfoFile": "./.tsbuildinfo",              /* Specify the path to .tsbuildinfo incremental compilation file. */
    // "disableSourceOfProjectReferenceRedirect": true,  /* Disable preferring source files instead of declaration files when referencing composite projects. */
    // "disableSolutionSearching": true,                 /* Opt a project out of multi-project reference checking when editing. */
    // "disableReferencedProjectLoad": true,             /* Reduce the number of projects loaded automatically by TypeScript. */

    /* Type Checking */
    "strict": true,                                      /* Enable all strict type-checking options. */
    // "noImplicitAny": true,                            /* Enable error reporting for expressions and declarations with an implied 'any' type. */

    /* Completeness */
    // "skipDefaultLibCheck": true,                      /* Skip type checking .d.ts files that are included with TypeScript. */
    "skipLibCheck": true                                 /* Skip type checking all .d.ts files. */
    // "preserveConstEnums": true,                      /* ... */
  }
}`;
    expect(parseTsConfigJson(testContent)).toStrictEqual({
      compilerOptions: {
        incremental: true,
        composite: true,
        tsBuildInfoFile: './.tsbuildinfo',
        disableSourceOfProjectReferenceRedirect: true,
        disableSolutionSearching: true,
        disableReferencedProjectLoad: true,
        strict: true,
        noImplicitAny: true,
        skipDefaultLibCheck: true,
        skipLibCheck: true,
        preserveConstEnums: true,
      },
    });
  });

  it('should remove empty lines', async () => {
    const testContent = `
    {

}
`;
    expect(parseTsConfigJson(testContent)).toStrictEqual({});
  });

  it('should remove block comments', async () => {
    const testContent = `/* general block comment */
{
/* property block comment */
"prop": 42, /* value block comment */
}`;
    expect(parseTsConfigJson(testContent)).toStrictEqual({ prop: 42 });
  });

  it('should remove line comments characters', async () => {
    const testContent = `{
// "prop": 42,
}`;
    expect(parseTsConfigJson(testContent)).toStrictEqual({ prop: 42 });
  });

  it('should add missing comma for existing properties before a inline comment property', async () => {
    const testContent = `{
      "pro1": 42
// "prop2": "value"
}`;
    expect(parseTsConfigJson(testContent)).toStrictEqual({
      pro1: 42,
      prop2: 'value',
    });
  });

  it('should not comma for opening objects "{"', async () => {
    const testContent = `{
"compilerOptions": {
// "prop2": [
"value"
]
}
}`;
    expect(parseTsConfigJson(testContent)).toStrictEqual({
      compilerOptions: { prop2: ['value'] },
    });
  });
});
