# @code-pushup/doc-coverage-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fdoc-coverage-plugin.svg)](https://www.npmjs.com/package/@code-pushup/doc-coverage-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fdoc-coverage-plugin)](https://npmtrends.com/@code-pushup/doc-coverage-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup%2Fdoc-coverage-plugin)](https://www.npmjs.com/package/@code-pushup/doc-coverage-plugin?activeTab=dependencies)

📚 **Code PushUp plugin for tracking documentation coverage.** 📝

This plugin allows you to measure and track documentation coverage in your TypeScript/JavaScript project.
It analyzes your codebase and checks for documentation on different code elements like classes, functions, interfaces, types, and variables.

Measured documentation types are mapped to Code PushUp audits in the following way:

- `value`: The value is the number of undocumented nodes -> 4
- `displayValue`: `${value} undocumented ${type}` -> 4 undocumented functions
- `score`: 0.5 -> total nodes 8, undocumented 4 -> 4/8
- The score is value converted to 0-1 range
- Missing documentation is mapped to issues in the audit details (undocumented classes, functions, interfaces, etc.)

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/doc-coverage-plugin
   ```

   ```sh
   yarn add --dev @code-pushup/doc-coverage-plugin
   ```

   ```sh
   pnpm add --save-dev @code-pushup/doc-coverage-plugin
   ```

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.ts`).

   ```js
   import docCoveragePlugin from '@code-pushup/doc-coverage-plugin';

   export default {
     // ...
     plugins: [
       // ...
       docCoveragePlugin({
         patterns: ['**/*.ts'],
       }),
     ],
   };
   ```

4. (Optional) Reference individual audits or the provided plugin group which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   💡 Assign weights based on what influence each documentation type should have on the overall category score (assign weight 0 to only include as extra info, without influencing category score).

   ```js
   export default {
     // ...
     categories: [
       {
         slug: 'documentation',
         title: 'Documentation',
         refs: [
           {
             type: 'group',
             plugin: 'doc-coverage',
             slug: 'doc-coverage',
             weight: 1,
           },
           // ...
         ],
       },
       // ...
     ],
   };
   ```

5. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## About documentation coverage

Documentation coverage is a metric that indicates what percentage of your code elements have proper documentation. It helps ensure your codebase is well-documented and maintainable.

The plugin provides multiple audits, one for each documentation type (classes, functions, interfaces, etc.), and groups them together for an overall documentation coverage measurement. Each audit:

- Measures the documentation coverage for its specific type (e.g., classes, functions)
- Provides a score based on the percentage of documented elements
- Includes details about which elements are missing documentation

These audits are grouped together to provide a comprehensive view of your codebase's documentation status. You can use either:

- The complete group of audits for overall documentation coverage
- Individual audits to focus on specific documentation types

## Plugin architecture

### Plugin configuration specification

The plugin accepts the following parameters:

#### patterns

Required parameter. The `patterns` option accepts an array of strings that define patterns to include or exclude files. You can use glob patterns to match files and the `!` symbol to exclude specific patterns. Example:

```js
docCoveragePlugin({
  patterns: [
    'src/**/*.ts',              // include all TypeScript files in src
    '!src/**/*.{spec,test}.ts', // exclude test files
    '!src/**/testing/**/*.ts'   // exclude testing utilities
  ],
}),
```

#### OnlyAudits

Optional parameter. The `onlyAudits` option allows you to specify which documentation types you want to measure. Only the specified audits will be included in the results. Example:

```js
docCoveragePlugin({
  patterns: ['src/**/*.ts'],
  onlyAudits: [
    'classes-coverage',
    'functions-coverage'
  ] // Only measure documentation for classes and functions
}),
```

#### SkipAudits

Optional parameter. The `skipAudits` option allows you to exclude specific documentation types from measurement. All other types will be included in the results.

```js
docCoveragePlugin({
  patterns: ['src/**/*.ts'],
  skipAudits: [
    'variables-coverage',
    'interfaces-coverage'
  ] // Measure all documentation types except variables and interfaces
}),
```

> ⚠️ **Warning:** You cannot use both `onlyAudits` and `skipAudits` in the same configuration. Choose the one that better suits your needs.

### Audits and group

This plugin provides a group for convenient declaration in your config. When defined this way, all measured documentation type audits have the same weight.

```ts
     // ...
     categories: [
       {
         slug: 'documentation',
         title: 'Documentation',
         refs: [
           {
             type: 'group',
             plugin: 'doc-coverage',
             slug: 'doc-coverage',
             weight: 1,
           },
           // ...
         ],
       },
       // ...
     ],
```

Each documentation type still has its own audit. So when you want to include a subset of documentation types or assign different weights to them, you can do so in the following way:

```ts
     // ...
     categories: [
       {
         slug: 'documentation',
         title: 'Documentation',
         refs: [
           {
             type: 'audit',
             plugin: 'doc-coverage',
             slug: 'class-doc-coverage',
             weight: 2,
           },
           {
             type: 'audit',
             plugin: 'doc-coverage',
             slug: 'function-doc-coverage',
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
  "packageName": "@code-pushup/doc-coverage-plugin",
  "version": "0.57.0",
  "title": "Documentation coverage",
  "slug": "doc-coverage",
  "icon": "folder-src",
  "duration": 920,
  "date": "2024-12-17T16:45:28.581Z",
  "audits": [
    {
      "slug": "percentage-coverage",
      "displayValue": "16 %",
      "value": 16,
      "score": 0.16,
      "details": {
        "issues": []
      },
      "title": "Percentage of codebase with documentation",
      "description": "Measures how many % of the codebase have documentation."
    }
  ],
  "description": "Official Code PushUp documentation coverage plugin.",
  "docsUrl": "https://www.npmjs.com/package/@code-pushup/doc-coverage-plugin/",
  "groups": [
    {
      "slug": "doc-coverage",
      "refs": [
        {
          "slug": "percentage-coverage",
          "weight": 1
        }
      ],
      "title": "Documentation coverage metrics",
      "description": "Group containing all defined documentation coverage types as audits."
    }
  ]
}
```
