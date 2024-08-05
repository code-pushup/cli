# @code-pushup/js-packages-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fjs-packages-plugin.svg)](https://www.npmjs.com/package/@code-pushup/js-packages-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fjs-packages-plugin)](https://npmtrends.com/@code-pushup/js-packages-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/js-packages-plugin)](https://www.npmjs.com/package/@code-pushup/js-packages-plugin?activeTab=dependencies)

📦 **Code PushUp plugin for JavaScript packages.** 🛡️

This plugin checks for known vulnerabilities and outdated dependencies.
It supports the following package managers:

- [NPM](https://docs.npmjs.com/)
- [Yarn v1](https://classic.yarnpkg.com/docs/)
- [Yarn v2+](https://yarnpkg.com/getting-started)
  - In order to check outdated dependencies for Yarn v2+, you need to install [`yarn-plugin-outdated`](https://github.com/mskelton/yarn-plugin-outdated).
- [PNPM](https://pnpm.io/pnpm-cli)

> ![NOTE]
> As of now, Yarn v2 does not support security audit of optional dependencies. Only production and dev dependencies audits will be included in the report.

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Install as a dev dependency with your package manager:

   ```sh
   npm install --save-dev @code-pushup/js-packages-plugin
   ```

   ```sh
   yarn add --dev @code-pushup/js-packages-plugin
   ```

   ```sh
   pnpm add --save-dev @code-pushup/js-packages-plugin
   ```

3. Insert plugin configuration with your package manager. By default, both `audit` and `outdated` checks will be run. The result should look as follows:

   ```js
   import jsPackagesPlugin from '@code-pushup/js-packages-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await jsPackagesPlugin(), // the package manager is automatically derived from your file system. Use { packageManager: 'npm' } to configure it.
     ],
   };
   ```

   You may run this plugin with a custom configuration for any supported package manager or command. A custom configuration will look similarly to the following:

   ```js
   import jsPackagesPlugin from '@code-pushup/js-packages-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await jsPackagesPlugin({ packageManager: 'yarn-classic', checks: ['audit'], dependencyGroups: ['prod'] }),
     ],
   };
   ```

4. (Optional) Reference individual audits or the provided plugin groups which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   💡 Assign weights based on what influence each command should have on the overall category score (assign weight 0 to only include as extra info, without influencing category score).

   ```js
   export default {
     // ...
     categories: [
       {
         slug: 'security',
         title: 'Security',
         refs: [
           {
             type: 'group',
             plugin: 'npm-audit', // replace prefix with your package manager
             slug: 'js-packages',
             weight: 1,
           },
         ],
       },
       {
         slug: 'up-to-date',
         title: 'Up-to-date tools',
         refs: [
           {
             type: 'group',
             plugin: 'npm-outdated', // replace prefix with your package manager
             slug: 'js-packages',
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

## Plugin architecture

### Plugin configuration specification

The plugin accepts the following parameters:

- `packageManager`: The package manager you are using. Supported values: `npm`, `yarn-classic` (v1), `yarn-modern` (v2+), `pnpm`.
- (optional) `checks`: Array of checks to be run. Supported commands: `audit`, `outdated`. Both are configured by default.
- (optional) `dependencyGroups`: Array of dependency groups to be checked. `prod` and `dev` are configured by default. `optional` are opt-in.
- (optional) `packageJsonPaths`: File path(s) to `package.json`. Root `package.json` is used by default. Multiple `package.json` paths may be passed. If `{ autoSearch: true }` is provided, all `package.json` files in the repository are searched.
- (optional) `auditLevelMapping`: If you wish to set a custom level of issue severity based on audit vulnerability level, you may do so here. Any omitted values will be filled in by defaults. Audit levels are: `critical`, `high`, `moderate`, `low` and `info`. Issue severities are: `error`, `warn` and `info`. By default the mapping is as follows: `critical` and `high` → `error`; `moderate` and `low` → `warning`; `info` → `info`.

### Audits and group

This plugin provides a group per check for a convenient declaration in your config. Each group contains audits for all selected groups of dependencies that are supported (`prod`, `dev` or `optional`).

```ts
     // ...
     categories: [
       {
         slug: 'dependencies',
         title: 'Package dependencies',
         refs: [
           {
             type: 'group',
             plugin: 'js-packages',
             slug: 'npm-audit', // replace prefix with your package manager
             weight: 1,
           },
           {
             type: 'group',
             plugin: 'js-packages',
             slug: 'npm-outdated', // replace prefix with your package manager
             weight: 1,
           },
           // ...
         ],
       },
       // ...
     ],
```

Each dependency group has its own audit. If you want to assign different weights to the audits or record different dependency groups for different checks (the bigger set needs to be included in the plugin configuration), you can do so in the following way:

```ts
     // ...
     categories: [
       {
         slug: 'dependencies',
         title: 'Package dependencies',
         refs: [
           {
             type: 'audit',
             plugin: 'js-packages',
             slug: 'npm-audit-prod', // replace prefix with your package manager
             weight: 2,
           },
                      {
             type: 'audit',
             plugin: 'js-packages',
             slug: 'npm-audit-dev', // replace prefix with your package manager
             weight: 1,
           },
           {
             type: 'audit',
             plugin: 'js-packages',
             slug: 'npm-outdated-prod', // replace prefix with your package manager
             weight: 2,
           },
           // ...
         ],
       },
       // ...
     ],
```

## Score calculation

Audit output score is a numeric value in the range 0-1.

### Security audit

The score for security audit is decreased for each vulnerability found based on its **severity**.

The mapping is as follows:

- Critical vulnerabilities set score to 0.
- High-severity vulnerabilities reduce score by 0.1.
- Moderate vulnerabilities reduce score by 0.05.
- Low-severity vulnerabilities reduce score by 0.02.
- Information-level vulnerabilities reduce score by 0.01.

Examples:

- 1+ **critical** vulnerabilities → score will be 0
- 1 high and 2 low vulnerabilities → score will be 1 - 0.1 - 2\*0.02 = 0.86

### Outdated dependencies

In order for this audit not to drastically lower the score, the current logic is such that only dependencies with **major** outdated version lower the score by a proportional amount to the total amount of dependencies on your project.

Examples:

- 5 dependencies out of which 1 has an outdated **major** version → score will be (5 - 1) / 5 = 0.8
- 2 dependencies out of which 1 has an outdated minor version and one is up-to-date → score stay 1
