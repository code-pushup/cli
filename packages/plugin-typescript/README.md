# @code-pushup/typescript-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Ftypescript-plugin.svg)](https://www.npmjs.com/package/@code-pushup/typescript-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Ftypescript-plugin)](https://npmtrends.com/@code-pushup/typescript-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/typescript-plugin)](https://www.npmjs.com/package/@code-pushup/typescript-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for measuring TypeScript quality with compiler diagnostics.** 🔥

This plugin allows you to **incrementally adopt strict compilation flags in TypeScript projects**.
It analyzes your codebase using the TypeScript compiler to detect potential issues and configuration problems.

TypeScript compiler diagnostics are mapped to Code PushUp audits in the following way:

- `value`: The number of issues found for a specific TypeScript configuration option (e.g. 3)
- `displayValue`: The number of issues found (e.g. "3 issues")
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

By default, a root `tsconfig.json` is used to compile your codebase. Based on those compiler options, the plugin will generate audits.

```ts
import typescriptPlugin from '@code-pushup/typescript-plugin';

export default {
  // ...
  plugins: [
    // ...
    await typescriptPlugin(),
  ],
};
```

4. Run the CLI with `npx code-pushup collect` and view or upload the report (refer to [CLI docs](../cli/README.md)).

## About TypeScript checks

The TypeScript plugin analyzes your codebase using the TypeScript compiler to identify potential issues and enforce best practices.
It helps ensure type safety and maintainability of your TypeScript code.

The plugin provides multiple audits grouped into different sets:

- _Semantic Errors_: `semantic-errors` - Errors that occur during type checking and type inference
- _Syntax Errors_: `syntax-errors` - Errors that occur during parsing and lexing of TypeScript source code
- _Configuration Errors_: `configuration-errors` - Errors that occur when parsing TypeScript configuration files
- _Declaration and Language Service Errors_: `declaration-and-language-service-errors` - Errors that occur during TypeScript language service operations
- _Internal Errors_: `internal-errors` - Errors that occur during TypeScript internal operations
- _No Implicit Any Errors_: `no-implicit-any-errors` - Errors related to `noImplicitAny` compiler option
- _Unknown Codes_: `unknown-codes` - Errors that do not match any known TypeScript error code

Each audit:

- Checks for specific TypeScript compiler errors and warnings
- Provides a score based on the number of issues found
- Includes detailed error messages and locations

Each set is also available as group in the plugin. See more under [Audits and Groups](./docs/audits-and-groups.md).

## Plugin architecture

### Plugin configuration specification

The plugin accepts the following parameters:

| Option     | Type     | Default         | Description                                                                                                                                 |
| ---------- | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| tsconfig   | string   | `tsconfig.json` | A string that defines the path to your `tsconfig.json` file                                                                                 |
| onlyAudits | string[] | undefined       | An array of audit slugs to specify which documentation types you want to measure. Only the specified audits will be included in the results |

#### `tsconfig`

Optional parameter. The `tsconfig` option accepts a string that defines the path to your config file and defaults to `tsconfig.json`.

```js
await typescriptPlugin({
  tsconfig: './tsconfig.json',
});
```

#### `onlyAudits`

The `onlyAudits` option allows you to specify which documentation types you want to measure. Only the specified audits will be included in the results. All audits are included by default. Example:

```js
await typescriptPlugin({
  onlyAudits: ['no-implicit-any'],
});
```

### Optionally set up categories

Reference audits (or groups) which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

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
        slug: 'semantic-errors',
        weight: 2,
      },
      {
        type: 'audit',
        plugin: 'typescript',
        slug: 'syntax-errors',
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
        slug: 'problems',
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
