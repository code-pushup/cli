# angular-ds-plugin

🕵️ **Code PushUp plugin for detecting styles usage of design systems in Angular** 📋

---

The plugin crawls the file base depending on your configuration and reports about the style usages.

You can configure the plugin with the following options:

- directory to crawl

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Copy the [plugin source](../angular-ds-plugin) as is into your project

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

   Pass in the path on the directory to crawl (relative to `process.cwd()`), as well as @TODO other options.

   ```js
   import angularDsPlugin from './angular-ds.plugin';

   export default {
     // ...
     plugins: [
       // ...
       angularDsPlugin({
         directory: 'ui',
       }),
     ],
   };
   ```

4. (Optional) Reference audits (or groups) that you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   Assign weights based on what influence each audit and group should have on the overall category score (assign weight 0 to only include it for extra info, without influencing the category score).

   ```js
   import angularDsPlugin, { recommendedRefs as angularDsRecommendedRefs } from './angular-ds.Plugin';

   export default {
     // ...
     categories: [
       // ...
       {
         slug: 'design-system',
         title: 'Design System',
         refs: [...angularDsRecommendedRefs],
       },
     ],
   };
   ```

5. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## Audits

Detailed information about the audits can be found in the docs folder of the plugin.

The following audits are present:

- [audit-xyz](@TODO - link to docs/xyz.audit.md)
