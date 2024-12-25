# @code-pushup/typescript-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Ftypescript-plugin.svg)](https://www.npmjs.com/package/@code-pushup/typescript-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Ftypescript-plugin)](https://npmtrends.com/@code-pushup/typescript-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/typescript-plugin)](https://www.npmjs.com/package/@code-pushup/typescript-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for measuring TypeScript quality with compiler diagnostics.** 🔥

This plugin allows you to measure and track TypeScript compiler diagnostics in your TypeScript/JavaScript project.
It analyzes your codebase using the TypeScript compiler to detect potential issues and configuration problems.

TypeScript compiler diagnostics are mapped to Code PushUp audits in the following way:

- `value`: The number of issues found for a specific TypeScript configuration option -> 3
- `displayValue`: The number of issues found -> 3 issues
- `score`: Binary scoring - 1 if no issues are found, 0 if any issues exist
- Issues are mapped to audit details, containing:
  - Source file location
  - Error message from TypeScript compiler
  - Code reference where the issue was found

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/typescript-plugin
   ```

   ```sh
   yarn add --dev @code-pushup/typescript-plugin
   ```

   ```sh
   pnpm add --save-dev @code-pushup/typescript-plugin
   ```

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.ts`).

   Pass in the URL you want to measure, along with optional [flags](#flags) and [config](#config) data.

   ```ts
   import typescriptPlugin from '@code-pushup/typescript-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await typescriptPlugin({
         tsConfigPath: './tsconfig.json',
       }),
     ],
   };
   ```

4. Run the CLI with `npx code-pushup collect` and view or upload the report (refer to [CLI docs](../cli/README.md)).

## About documentation coverage

The TypeScript plugin analyzes your codebase using the TypeScript compiler to identify potential issues and enforce best practices. It helps ensure type safety and maintainability of your TypeScript code.

The plugin provides multiple audits grouped into different categories like:

- Language and Environment - Checks configuration for TypeScript features like decorators, JSX, target version
- Type Checking - Validates strict null checks, implicit any/this, function types
- Module Resolution - Verifies module imports/exports and resolution settings
- Build/Emit Options - Checks output generation and optimization settings
- Control Flow - Analyzes code flow, unreachable code, switch statements

Each audit:

- Checks for specific TypeScript compiler errors and warnings
- Provides a score based on the number of issues found
- Includes detailed error messages and locations

The audits are organized into logical groups to give you a comprehensive view of your TypeScript configuration and code quality. You can:

- Use all groups for complete TypeScript analysis
- Focus on specific groups or individual audits based on your needs

## Plugin architecture

### Plugin configuration specification

The plugin accepts the following parameters:

#### TsConfigPath

Required parameter. The `tsConfigPath` option accepts a string that defines the path to your `tsconfig.json` file.

```js
typescriptPlugin({
  tsConfigPath: './tsconfig.json',
}),
```

#### OnlyAudits

Optional parameter. The `onlyAudits` option allows you to specify which documentation types you want to measure. Only the specified audits will be included in the results. Example:

```js
typescriptPlugin({
  tsConfigPath: './tsconfig.json',
  onlyAudits: [
    'no-implicit-any'
  ] // Only measure documentation for classes and functions
}),
```

### Audits and group

This plugin provides a list of groups to cover different TypeScript configuration options and their areas of responsibility.

```ts
     // ...
     categories: [
       {
         slug: 'typescript',
         title: 'TypeScript',
         refs: [
           {
             slug: 'language-and-environment',
             weight: 1,
             type: 'group',
             plugin: 'typescript'
           },
           // ...
         ],
       },
       // ...
     ],
```

Each TypeScript configuration option still has its own audit. So when you want to include a subset of configuration options or assign different weights to them, you can do so in the following way:

```ts
     // ...
     categories: [
       {
         slug: 'typescript',
         title: 'TypeScript',
         refs: [
           {
             type: 'audit',
             plugin: 'typescript',
             slug: 'no-implicit-any',
             weight: 2,
           },
           {
             type: 'audit',
             plugin: 'typescript',
             slug: 'no-explicit-any',
             weight: 1,
           },
           // ...
         ],
       },
       // ...
     ],
```

### Audit output

The plugin outputs a single audit that measures the overall documentation coverage percentage of your codebase.

For instance, this is an example of the plugin output:

```json
{
  "packageName": "@code-pushup/typescript-plugin",
  "version": "0.57.0",
  "title": "Typescript",
  "slug": "typescript",
  "icon": "typescript",
  "date": "2024-12-25T11:10:22.646Z",
  "duration": 2059,
  "audits": [
    {
      "slug": "experimental-decorators",
      "value": 0,
      "score": 1,
      "title": "ExperimentalDecorators",
      "docsUrl": "https://www.typescriptlang.org/tsconfig/#experimentalDecorators"
    }
  ],
  "description": "Official Code PushUp typescript plugin.",
  "docsUrl": "https://www.npmjs.com/package/@code-pushup/typescript-plugin/",
  "groups": [
    {
      "slug": "language-and-environment",
      "refs": [
        {
          "slug": "experimental-decorators",
          "weight": 1
        }
      ],
      "title": "LanguageAndEnvironment",
      "description": "Configuration options for TypeScript language features and runtime environment"
    }
  ]
}
```
