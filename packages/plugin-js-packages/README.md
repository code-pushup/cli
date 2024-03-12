# @code-pushup/js-packages-plugin

[![npm](https://img.shields.io/npm/v/%40code-pushup%2Fjs-packages-plugin.svg)](https://www.npmjs.com/package/@code-pushup/js-packages-plugin)
[![downloads](https://img.shields.io/npm/dm/%40code-pushup%2Fjs-packages-plugin)](https://npmtrends.com/@code-pushup/js-packages-plugin)
[![dependencies](https://img.shields.io/librariesio/release/npm/%40code-pushup/js-packages-plugin)](https://www.npmjs.com/package/@code-pushup/js-packages-plugin?activeTab=dependencies)

📦 **Code PushUp plugin for JavaScript packages.** 🛡️

This plugin checks for known vulnerabilities and outdated dependencies.
It supports the following package managers:

- [NPM](https://docs.npmjs.com/)
- [Yarn v1](https://classic.yarnpkg.com/docs/) & [Yarn v2+](https://yarnpkg.com/getting-started)
- [PNPM](https://pnpm.io/pnpm-cli)

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Insert plugin configuration with your package manager. By default, both `audit` and `outdated` checks will be run. The result should look as follows:

   ```js
   import jsPackagesPlugin from '@code-pushup/js-packages-plugin';

   export default {
     // ...
     plugins: [
       // ...
       await jsPackagesPlugin({ packageManager: 'npm' }), // replace with your package manager
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
       await jsPackagesPlugin({ packageManager: ['yarn'], checks: ['audit'] }),
     ],
   };
   ```

3. (Optional) Reference individual audits or the provided plugin groups which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

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

4. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## Plugin architecture

### Plugin configuration specification

The plugin accepts the following parameters:

- `packageManager`: The package manager you are using. Supported values: `npm`, `yarn-classic` (v1), `yarn-modern` (v2+), `pnpm`.
- (optional) `checks`: Array of checks to be run. Supported commands: `audit`, `outdated`. Both are configured by default.
- (optional) `auditLevelMapping`: If you wish to set a custom level of issue severity based on audit vulnerability level, you may do so here. Any omitted values will be filled in by defaults. Audit levels are: `critical`, `high`, `moderate`, `low` and `info`. Issue severities are: `error`, `warn` and `info`. By default the mapping is as follows: `critical` and `high` → `error`; `moderate` and `low` → `warning`; `info` → `info`.

### Audits and group

This plugin provides a group per check for a convenient declaration in your config.

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

Each dependency group has its own audit. If you want to check only a subset of dependencies (e.g. run audit and outdated for production dependencies) or assign different weights to them, you can do so in the following way:

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
