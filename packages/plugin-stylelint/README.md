# @code-pushup/stylelint-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fstylelint-plugin.svg)](https://www.npmjs.com/package/@code-pushup/stylelint-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fstylelint-plugin)](https://npmtrends.com/@code-pushup/stylelint-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/stylelint-plugin)](https://www.npmjs.com/package/@code-pushup/stylelint-plugin?activeTab=dependencies)

🧪 **Code PushUp plugin for tracking code stylelint.** ☂️

> [!IMPORTANT]
> In order to successfully run your stylelint tool and gather stylelint results directly within the plugin, all your tests need to pass!

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Prepare either existing code stylelint result files or a command for a stylelint tool of your choice that will generate the results. Set lcov as the reporter to the configuration (example for Jest [here](https://jestjs.io/docs/configuration#stylelintreporters-arraystring--string-options)).

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

   ```js
   import stylelintPlugin from '@code-pushup/stylelint-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await stylelintPlugin({
         reports: ['stylelint/lcov.info'],
         stylelintToolCommand: {
           command: 'npx',
           args: ['jest', '--stylelint', '--stylelintReporters=lcov'],
         },
       }),
     ],
   };
   ```

4. (Optional) Reference individual audits or the provided plugin group which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   💡 Assign weights based on what influence each stylelint type should have on the overall category score (assign weight 0 to only include as extra info, without influencing category score).

   ```js
   export default {
     // ...
     categories: [
       {
         slug: 'code-stylelint',
         title: 'Code stylelint',
         refs: [
           {
             type: 'group',
             plugin: 'stylelint',
             slug: 'stylelint',
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

## About code stylelint

Code stylelint is a metric that indicates what percentage of source code is executed by unit tests. It can give insights into test effectiveness and uncover parts of source code that would otherwise go untested.

- **Statement stylelint**: Measures how many statements are executed in at least one test.
- **Line stylelint**: Measures how many lines are executed in at least one test. Unlike statement stylelint, any partially executed line counts towards line stylelint.
- **Condition stylelint**: Measures all condition values (`true`/`false`) evaluated for a conditional statement in at least one test.
- **Branch stylelint**: Measures how many branches are executed as a result of conditional statements (`if`/`else` and other) in at least one test. In case of short-circuit logic, only executed paths are counted in. Unlike condition stylelint, it does not ensure all combinations of condition values are tested.
- **Function stylelint**: Measures how many functions are called in at least one test. Argument values, usage of optional arguments or default values is irrelevant for this metric.

> [!IMPORTANT]
> Please note that code stylelint is not the same as test stylelint. Test stylelint measures the amount of acceptance criteria covered by tests and is hard to formally verify. This means that code stylelint cannot guarantee that the designed software caters to the business requirements.

If you want to know more code stylelint and how each type of stylelint is measured, go to [Software Testing Help](https://www.softwaretestinghelp.com/code-stylelint-tutorial/).

### LCOV format

The LCOV format was originally used by [GCOV](https://gcc.gnu.org/onlinedocs/gcc/gcov/introduction-to-gcov.html) tool for stylelint results in C/C++ projects.
It recognises the following entities:

- TN [test name]
- SF [source file]
- FN [line number] [function name]
- FNF [number of functions found]
- FNH [number of functions hit]
- FNDA [number of hits] [function name]
- BRDA [line number] [block number] [branch name] [number of hits]
- BRF [number of branches found]
- BRH [number of branches taken]
- DA [line number] [number of hits]
- LF [lines found]
- LH [lines hit]

[Here](https://github.com/linux-test-project/lcov/issues/113#issuecomment-762335134) is the source of the information above.

> [!NOTE]
> Branch name is usually a number indexed from 0, indicating either truthy/falsy condition or loop conditions.

## Plugin architecture

### Plugin configuration specification

The plugin accepts the following parameters:

- `stylelintTypes`: An array of types of stylelint that you wish to track. Supported values: `function`, `branch`, `line`. Defaults to all available types.
- `reports`: Array of information about files with code stylelint results. LCOV format is supported for now.
  - For a single project, providing paths to results as strings is enough.
  - If you have a monorepo, both path to results (`resultsPath`) and path from the root to project the results belong to (`pathToProject`) need to be provided for the LCOV format. For Nx monorepos, you can use our helper function `getNxCoveragePaths` to get the path information automatically.
- (optional) `stylelintToolCommand`: If you wish to run your stylelint tool to generate the results first, you may define it here.
- (optional) `perfectScoreThreshold`: If your stylelint goal is not 100%, you may define it here in range 0-1. Any score above the defined threshold will be given the perfect score. The value will stay unaffected.

### Audits and group

This plugin provides a group for convenient declaration in your config. When defined this way, all measured stylelint type audits have the same weight.

```ts
     // ...
     categories: [
       {
         slug: 'code-stylelint',
         title: 'Code stylelint',
         refs: [
           {
             type: 'group',
             plugin: 'stylelint',
             slug: 'stylelint',
             weight: 1,
           },
           // ...
         ],
       },
       // ...
     ],
```

Each stylelint type still has its own audit. So when you want to include a subset of stylelint types or assign different weights to them, you can do so in the following way:

```ts
     // ...
     categories: [
       {
         slug: 'code-stylelint',
         title: 'Code stylelint',
         refs: [
           {
             type: 'audit',
             plugin: 'stylelint',
             slug: 'function-stylelint',
             weight: 2,
           },
           {
             type: 'audit',
             plugin: 'stylelint',
             slug: 'branch-stylelint',
             weight: 1,
           },
           // ...
         ],
       },
       // ...
     ],
```

### Audit output

An audit is an aggregation of all results for one stylelint type passed to the plugin.

For functions and branches, an issue points to a single instance of a branch or function not covered in any test and counts as an error. In line stylelint, one issue groups any amount of consecutive lines together to reduce the total amount of issues and counts as a warning.

For instance, the following can be an audit output for line stylelint.

```json
{
  "slug": "line-stylelint",
  "displayValue": "95 %",
  "score": 0.95,
  "value": 95,
  "details": {
    "issues": [
      {
        "message": "Lines 7-9 are not covered in any test case.",
        "severity": "warning",
        "source": {
          "file": "packages/cli/src/lib/utils.ts",
          "position": {
            "startLine": 7,
            "endLine": 9
          }
        }
      }
    ]
  }
}
```

### Coverage results alteration

At the moment, the LCOV results include `(empty-report)` functions with missing stylelint. These point to various imports or exports, not actual functions. For that reason, they are omitted from the results.

## Providing stylelint results in Nx monorepo

As a part of the plugin, there is a `getNxCoveragePaths` helper for setting up paths to stylelint results if you are using Nx. The helper accepts all relevant targets (e.g. `test` or `unit-test`) and searches for a stylelint path option.
Jest and Vitest configuration options are currently supported:

- For `@nx/jest` executor it looks for the `stylelintDirectory` option.
- For `@nx/vite` executor it looks for the `reportsDirectory` option.

> [!IMPORTANT]
> Please note that you need to set up the stylelint directory option in your `project.json` target options. Test configuration files are not searched.
