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

   - If you wish to combine all projects in your workspace into one report, use the `eslintConfigFromAllNxProjects` helper:

     ```js
     import eslintPlugin, { eslintConfigFromAllNxProjects } from '@code-pushup/eslint-plugin';

     export default {
       plugins: [
         // ...
         await eslintPlugin(await eslintConfigFromAllNxProjects()),
       ],
     };
     ```

     You can also exclude specific projects if needed by passing their names in the `exclude` option:

     ```js
     await eslintConfigFromAllNxProjects({ exclude: ['server'] });
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

### Custom groups

You can extend the plugin configuration with custom groups to categorize ESLint rules according to your project's specific needs. Custom groups allow you to assign weights to individual rules, influencing their impact on the report. Rules can be defined as an object with explicit weights or as an array where each rule defaults to a weight of 1. Additionally, you can use wildcard patterns (`*`) to include multiple rules with similar prefixes.

```js
import eslintPlugin from '@code-pushup/eslint-plugin';

export default {
  // ...
  plugins: [
    // ...
    await eslintPlugin(
      { eslintrc: '.eslintrc.js', patterns: ['src/**/*.js'] },
      {
        groups: [
          {
            slug: 'modern-angular',
            title: 'Modern Angular',
            rules: {
              '@angular-eslint/template/prefer-control-flow': 3,
              '@angular-eslint/template/prefer-ngsrc': 2,
              '@angular-eslint/component-selector': 1,
            },
          },
          {
            slug: 'type-safety',
            title: 'Type safety',
            rules: ['@typescript-eslint/no-unsafe-*'],
          },
        ],
      },
    ),
  ],
};
```

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

## Artifacts generation and loading

In addition to running ESLint from the plugin implementation, you can configure the plugin to consume pre-generated ESLint reports (artifacts). This is particularly useful for:

- **CI/CD pipelines**: Use cached lint results from your build system
- **Monorepo setups**: Aggregate results from multiple projects or targets
- **Performance optimization**: Skip ESLint execution when reports are already available
- **Custom workflows**: Integrate with existing linting infrastructure

The artifacts feature supports loading ESLint JSON reports that follow the standard `ESLint.LintResult[]` format.

### Basic artifact configuration

Specify the path(s) to your ESLint JSON report files:

```js
import eslintPlugin from '@code-pushup/eslint-plugin';

export default {
  plugins: [
    await eslintPlugin({
      artifacts: {
        artifactsPaths: './eslint-report.json',
      },
    }),
  ],
};
```

### Multiple artifact files

Use glob patterns to aggregate results from multiple files:

```js
export default {
  plugins: [
    await eslintPlugin({
      artifacts: {
        artifactsPaths: ['packages/**/eslint-report.json', 'apps/**/.eslint/*.json'],
      },
    }),
  ],
};
```

### Generate artifacts with custom command

If you need to generate the artifacts before loading them, use the `generateArtifactsCommand` option:

```js
export default {
  plugins: [
    await eslintPlugin({
      artifacts: {
        generateArtifactsCommand: 'npm run lint:report',
        artifactsPaths: './eslint-report.json',
      },
    }),
  ],
};
```

You can also specify the command with arguments:

```js
export default {
  plugins: [
    await eslintPlugin({
      artifacts: {
        generateArtifactsCommand: {
          command: 'eslint',
          args: ['src/**/*.{js,ts}', '--format=json', '--output-file=eslint-report.json'],
        },
        artifactsPaths: './eslint-report.json',
      },
    }),
  ],
};
```

## Nx Monorepo Setup

### Caching artifact generation

To leverage Nx's caching capabilities, you need to generate a JSON artifact for caching, while still being able to see the ESLint violations in the terminal or CI logs, so you can fix them.
This can be done by leveraging eslint formatter.

_lint target from nx.json_

```json
{
  "lint": {
    "inputs": ["lint-eslint-inputs"],
    "outputs": ["{projectRoot}/.eslint/**/*"],
    "cache": true,
    "executor": "nx:run-commands",
    "options": {
      "command": "eslint",
      "args": ["{projectRoot}/**/*.ts", "{projectRoot}/package.json", "--config={projectRoot}/eslint.config.js", "--max-warnings=0", "--no-warn-ignored", "--error-on-unmatched-pattern=false", "--format=@code-pushup/eslint-formatter-multi"],
      "env": {
        "ESLINT_FORMATTER_CONFIG": "{\"outputDir\":\"{projectRoot}/.eslint\"}"
      }
    }
  }
}
```

As you can now generate the `eslint-report.json` from cache your plugin configuration can directly consume them.

_code-pushup.config.ts target from nx.json_

```jsonc
{
  "code-pushup": {
    "dependsOn": ["lint"],
    // also multiple targets can be merged into one report
    //     "dependsOn": ["lint", "lint-next"],
    "executor": "nx:run-commands",
    "options": {
      "command": "npx code-pushup",
    },
  },
}
```

and the project configuration leverages `dependsOn` to ensure the artefacts are generated when running code-pushup.

Your `code-pushup.config.ts` can then be configured to consume the cached artifacts:

```js
import eslintPlugin from '@code-pushup/eslint-plugin';

export default {
  plugins: [
    await eslintPlugin({
      artifacts: {
        artifactsPaths: 'packages/**/.eslint/eslint-report-*.json',
      },
    }),
  ],
};
```

---

Find more details in our [Nx setup guide](https://github.com/code-pushup/cli/wiki/Code-PushUp-integration-guide-for-Nx-monorepos#eslint-config).
