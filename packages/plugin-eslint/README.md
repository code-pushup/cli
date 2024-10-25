# @code-pushup/eslint-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Feslint-plugin.svg)](https://www.npmjs.com/package/@code-pushup/eslint-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Feslint-plugin)](https://npmtrends.com/@code-pushup/eslint-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/eslint-plugin)](https://www.npmjs.com/package/@code-pushup/eslint-plugin?activeTab=dependencies)

🕵️ **Code PushUp plugin for detecting problems in source code using ESLint.** 📋

---

The plugin parses your ESLint configuration and lints targetted files using [ESLint's Node.js API](https://eslint.org/docs/latest/integrate/nodejs-api).

Detected ESLint rules are mapped to Code PushUp audits. Audit reports are calculated from the lint results in the following way:

- the score is a binary "pass" or "fail" - 1 if no errors or warnings are found, otherwise 0
- the value equals the sum of all errors and warnings
- individual errors and warnings are mapped to issues in the audit details

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/eslint-plugin
   ```

   ```sh
   yarn add --dev @code-pushup/eslint-plugin
   ```

   ```sh
   pnpm add --save-dev @code-pushup/eslint-plugin
   ```

3. Prepare an [ESLint configuration file](https://eslint.org/docs/latest/use/configure/configuration-files) with rules you're interested in measuring.

   Remember that Code PushUp only collects and uploads the results, it doesn't fail if errors are found.
   So you can be more strict than in most linter setups, the idea is to set aspirational goals and track your progress.

   > 💡 We recommend extending our own [`@code-pushup/eslint-config`](https://www.npmjs.com/package/@code-pushup/eslint-config). 😇

4. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

   Pass in the path to your ESLint config file, along with glob patterns for which files you wish to target (relative to `process.cwd()`).

   ```js
   import eslintPlugin from '@code-pushup/eslint-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await eslintPlugin({ eslintrc: '.eslintrc.js', patterns: ['src/**/*.js'] }),
     ],
   };
   ```

   If you're using an Nx monorepo, additional helper functions are provided to simplify your configuration:

   - If you wish to combine all projects in your workspace into one report, use the `eslintConfigFromAllNxProjects` helper. You can exclude specific projects if needed by passing their names in the exclude option:

     ```js
     import eslintPlugin, { eslintConfigFromAllNxProjects } from '@code-pushup/eslint-plugin';

     export default {
       plugins: [
         // ...
         await eslintPlugin(await eslintConfigFromAllNxProjects({ exclude: ['server'] })),
       ],
     };
     ```

   - If you wish to target a specific project along with other projects it depends on, use the `eslintConfigFromNxProjectAndDeps` helper and pass in in your project name:

     ```js
     import eslintPlugin, { eslintConfigFromNxProjectAndDeps } from '@code-pushup/eslint-plugin';

     export default {
       plugins: [
         // ...
         await eslintPlugin(await eslintConfigFromNxProjectAndDeps('<PROJECT-NAME>')),
       ],
     };
     ```

5. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

### Optionally set up categories

1. Reference audits (or groups) which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   Assign weights based on what influence each ESLint rule should have on the overall category score (assign weight 0 to only include as extra info, without influencing category score).
   Note that categories can combine multiple plugins.

   ```js
   export default {
     // ...
     categories: [
       {
         slug: 'code-style',
         title: 'Code style',
         refs: [
           {
             type: 'audit',
             plugin: 'eslint',
             slug: 'no-var',
             weight: 1,
           },
           {
             type: 'audit',
             plugin: 'eslint',
             slug: 'prefer-const',
             weight: 1,
           },
           {
             type: 'audit',
             plugin: 'eslint',
             slug: 'react-hooks-rules-of-hooks',
             weight: 2,
           },
           // ...
         ],
       },
       {
         slug: 'performance',
         title: 'Performance',
         refs: [
           // ... weighted performance audits (e.g. from Lighthouse) ...
           {
             type: 'audit',
             plugin: 'eslint',
             slug: 'react-jsx-key',
             weight: 0,
           },
           // ...
         ],
       },
       // ...
     ],
   };
   ```

   Referencing individual audits provides a lot of granularity, but it can be difficult to maintain such a configuration when there is a high amount of lint rules. A simpler way is to reference many related audits at once using groups. E.g. you can distinguish rules which have declared a type of `problem`, `suggestion`, or `layout`:

   ```js
   export default {
     // ...
     categories: [
       {
         slug: 'bug-prevention',
         title: 'Bug prevention',
         refs: [
           {
             type: 'group',
             plugin: 'eslint',
             slug: 'problems',
             weight: 100,
           },
         ],
       },
       {
         slug: 'code-style',
         title: 'Code style',
         refs: [
           {
             type: 'group',
             plugin: 'eslint',
             slug: 'suggestions',
             weight: 75,
           },
           {
             type: 'group',
             plugin: 'eslint',
             slug: 'formatting',
             weight: 25,
           },
         ],
       },
     ],
   };
   ```

2. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## Nx Monorepo Setup

Find all details in our [Nx setup guide](https://github.com/code-pushup/cli/wiki/Code-PushUp-integration-guide-for-Nx-monorepos#eslint-config).
