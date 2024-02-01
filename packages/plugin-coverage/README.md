# @code-pushup/coverage-plugin

**Code PushUp plugin for tracking code coverage.**

This plugin allows you to measure and track code coverage on your project.

Measured coverage types are mapped to Code PushUp audits in the following way

- The value is in range 0-100 and represents the code coverage for all passed results (_covered / total_)
- the score is value converted to 0-1 range
- missing coverage is mapped to issues in the audit details (uncalled functions, uncovered branches or lines)

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Prepare either existing code coverage result files or a command for a coverage tool of your choice that will generate the results. Set lcov as the reporter to the configuration (example for Jest [here](https://jestjs.io/docs/configuration#coveragereporters-arraystring--string-options)).

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

   Pass coverage types you wish to track (line, branch or function), paths to the code coverage results in LCOV format and optionally define your code coverage tool to be run first.

   > [!IMPORTANT]
   > Please note that when you define the tool command, you still need to define the paths to the coverage results.

   The configuration will look similarly to the following:

   ```js
   import coveragePlugin from '@code-pushup/coverage-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await coveragePlugin({
         coverageType: ['branch', 'function', 'line'],
         reports: ['coverage/cli/lcov.info'],
         coverageToolCommand: {
           command: 'npx',
           args: ['jest', '--coverage', '--coverageReporters=lcov'],
         },
       }),
     ],
   };
   ```

4. (Optional) Reference audits which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   > [!TIP]
   > Assign weights based on what influence each coverage type should have on the overall category score (assign weight 0 to only include as extra info, without influencing category score).

   ```js
   export default {
     // ...
     categories: [
       {
         slug: 'code-coverage',
         title: 'Code coverage',
         refs: [
           {
             type: 'audit',
             plugin: 'coverage',
             slug: 'function-coverage',
             weight: 2,
           },
           {
             type: 'audit',
             plugin: 'coverage',
             slug: 'branch-coverage',
             weight: 1,
           },
           {
             type: 'audit',
             plugin: 'coverage',
             slug: 'line-coverage',
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

## About code coverage

Code coverage is a metric that indicates what percentage of source code is executed by unit tests. It can give insights into test effectiveness and uncover parts of source code that would otherwise go untested.

> [!IMPORTANT]
> Please note that code coverage is not the same as test coverage. Test coverage measures the amount of acceptance criteria covered by tests and is hard to formally verify. This means that code coverage cannot guarantee that the designed software caters to the business requirements.

If you want to know more code coverage and how each type of coverage is measured, go to [Software Testing Help](https://www.softwaretestinghelp.com/code-coverage-tutorial/).

### LCOV format

The LCOV format was originally used by [GCOV](https://gcc.gnu.org/onlinedocs/gcc/gcov/introduction-to-gcov.html) tool for coverage results in C/C++ projects.
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

- `coverageType`: An array of types of coverage that you wish to track. Supported values: `function`, `branch`, `line`.
- `reports`: Array of paths to files with code coverage results. LCOV format is supported for now.
- (optional) `coverageToolCommand`: If you wish to run your coverage tool to generate the results first, you may define it here.
- (optional) `perfectScoreThreshold`: If your coverage goal is not 100%, you may define it here in range 0-1. Any score above the defined threshold will be given the perfect score. The value will stay unaffected.

### Audit output

An audit is an aggregation of all results for one coverage type passed to the plugin.

For functions and branches, an issue points to a single instance of a branch or function not covered in any test and counts as an error. In line coverage, one issue groups any amount of consecutive lines together to reduce the total amount of issues and counts as a warning.

For instance, the following can be an audit output for line coverage.

```json
{
  "slug": "line-coverage",
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
