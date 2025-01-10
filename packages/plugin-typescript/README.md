# @code-pushup/typescript-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Ftypescript-plugin.svg)](https://www.npmjs.com/package/@code-pushup/typescript-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Ftypescript-plugin)](https://npmtrends.com/@code-pushup/typescript-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/typescript-plugin)](https://www.npmjs.com/package/@code-pushup/typescript-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for measuring TypeScript quality with compiler diagnostics.** 🔥

This plugin allows you to **incrementally adopting strict compilation flags in TypeScript projects**.
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

Define the ts config file used to compile your codebase. Based on those compiler options the plugin will generate audits.

```ts
import typescriptPlugin from '@code-pushup/typescript-plugin';

export default {
  // ...
  plugins: [
    // ...
    typescriptPlugin({
      tsConfigPath: './tsconfig.json',
      onlyAudits: ['no-implicit-any'],
    }),
  ],
};
```

4. Run the CLI with `npx code-pushup collect` and view or upload the report (refer to [CLI docs](../cli/README.md)).

## About TypeScript checks

The TypeScript plugin analyzes your codebase using the TypeScript compiler to identify potential issues and enforce best practices.
It helps ensure type safety and maintainability of your TypeScript code.

The plugin provides multiple audits grouped into different sets:

- Language and Environment - Configuration options for TypeScript language features and runtime environment, including decorators, JSX support, target ECMAScript version, and class field behaviors
- Interop Constraints - Settings that control how TypeScript interoperates with other JavaScript code, including module imports/exports and case sensitivity rules
- Watch Options - Configuration for TypeScript watch mode behavior, including file watching strategies and dependency tracking
- Project References - Options for managing TypeScript project references, composite projects, and build optimization settings
- Module Resolution - Settings that control how TypeScript finds and resolves module imports, including Node.js resolution, package.json exports/imports, and module syntax handling
- Type Checking Behavior - Configuration for TypeScript type checking strictness and error reporting, including property access rules and method override checking
- Control Flow Options - Settings that affect code flow analysis, including handling of unreachable code, unused labels, switch statements, and async/generator functions
- Strict Checks - Strict type checking options that enable additional compile-time verifications, including null checks, implicit any/this, and function type checking
- Build/Emit Options - Configuration options that control TypeScript output generation, including whether to emit files, how to handle comments and declarations, and settings for output optimization and compatibility helpers

Each audit:

- Checks for specific TypeScript compiler errors and warnings
- Provides a score based on the number of issues found
- Includes detailed error messages and locations

Each set is also available as group in the plugin. See more under [Audits and Groups]()

## Plugin architecture

### Plugin configuration specification

The plugin accepts the following parameters:

| Option       | Type     | Default         | Description                                                                                                                                 |
| ------------ | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| tsConfigPath | string   | `tsconfig.json` | A string that defines the path to your `tsconfig.json` file                                                                                 |
| onlyAudits   | string[] | undefined       | An array of audit slugs to specify which documentation types you want to measure. Only the specified audits will be included in the results |

#### TsConfigPath

Optional parameter. The `tsConfigPath` option accepts a string that defines the path to your config file and defaults to `tsconfig.json`.

```js
typescriptPlugin({
  tsConfigPath: './tsconfig.json',
});
```

#### OnlyAudits

Optional parameter. The `onlyAudits` option allows you to specify which documentation types you want to measure. Only the specified audits will be included in the results. Example:

```js
typescriptPlugin({
  onlyAudits: ['no-implicit-any'],
});
```

### Optionally set up categories

1. Reference audits (or groups) which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

Assign weights based on what influence each TypeScript checks should have on the overall category score (assign weight 0 to only include as extra info, without influencing category score).

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
];
```

Also groups can be used:

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
        plugin: 'typescript',
      },
      // ...
    ],
  },
  // ...
];
```
