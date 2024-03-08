# @code-pushup/js-packages-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fjs-packages-plugin.svg)](https://www.npmjs.com/package/@code-pushup/js-packages-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fjs-packages-plugin)](https://npmtrends.com/@code-pushup/js-packages-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/js-packages-plugin)](https://www.npmjs.com/package/@code-pushup/js-packages-plugin?activeTab=dependencies)

📦 **Code PushUp plugin for JavaScript packages.** 🛡️

This plugin allows you to list outdated dependencies and run audit for known vulnerabilities.
It supports the following package managers: npm, yarn, yarn berry, pnpm.

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Insert plugin configuration. By default, npm audit and npm outdated commands will be run.

   Default configuration will look as follows:

   ```js
   import jsPackagesPlugin from '@code-pushup/js-packages-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await jsPackagesPlugin(),
     ],
   };
   ```

   You may run this plugin with a custom configuration for any supported package manager or command.

   A custom configuration will look similarly to the following:

   ```js
   import jsPackagesPlugin from '@code-pushup/js-packages-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await jsPackagesPlugin({ packageManager: ['yarn'], features: ['audit'] }),
     ],
   };
   ```

3. (Optional) Reference individual audits or the provided plugin group which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   💡 Assign weights based on what influence each command should have on the overall category score (assign weight 0 to only include as extra info, without influencing category score).

   ```js
   export default {
     // ...
     categories: [
       {
         slug: 'dependencies',
         title: 'Package dependencies',
         refs: [
           {
             type: 'group',
             plugin: 'npm-package-manager', // replace prefix with your package manager
             slug: 'js-packages',
             weight: 1,
           },
         ],
       },
       // ...
     ],
   };
   ```

4. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## Plugin architecture

### Plugin configuration specification

The plugin accepts the following parameters:

- (optional) `packageManager`: The package manager you are using. Supported values: `npm`, `yarn` (v1), `yarn-berry` (v2+), `pnpm`. Default is `npm`.
- (optional) `features`: Array of commands to be run. Supported commands: `audit`, `outdated`. Both are configured by default.
- (optional) `auditLevelMapping`: If you wish to set a custom level of issue severity based on audit vulnerability level, you may do so here. Any omitted values will be filled in by defaults. Audit levels are: `critical`, `high`, `moderate`, `low` and `info`. Issue severities are: `error`, `warn` and `info`. By default the mapping is as follows: `critical` and `high` → `error`; `moderate` and `low` → `warning`; `info` → `info`.

> [!NOTE]
> All parameters are optional so the plugin can be called with no arguments in the default setting.

### Audits and group

This plugin provides a group for convenient declaration in your config. When defined this way, all measured coverage type audits have the same weight.

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
             slug: 'npm-package-manager', // replace prefix with your package manager
             weight: 1,
           },
           // ...
         ],
       },
       // ...
     ],
```

Each package manager command still has its own audit. So when you want to include a subset of commands or assign different weights to them, you can do so in the following way:

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
             slug: 'npm-audit', // replace prefix with your package manager
             weight: 2,
           },
           {
             type: 'audit',
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
