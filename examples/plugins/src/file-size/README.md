# file-size-plugin

🕵️ **Code PushUp plugin for detecting changes in file size using different compressions** 📋

---

The plugin crawls the file base depending on your configuration and reports about their file size.

You can configure the plugin with the following options:

- directory to crawl
- file name pattern
- budget as number in bytes

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Copy the [plugin source](../file-size) as is into your project

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

   Pass in the path od the directory to crawl (relative to `process.cwd()`), as well as patterns and a budgget.

   ```js
   import fileSizePlugin from './file-size.plugin';

   export default {
     // ...
     plugins: [
       // ...
       fileSizePlugin({
         directory: 'dist',
         patterns: /.js$/,
         budget: 42000,
       }),
     ],
   };
   ```

4. (Optional) Reference audits (or groups) which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   Assign weights based on what influence each audit and group should have on the overall category score (assign weight 0 to only include it for extra info, without influencing the category score).

   ```js
   import fileSizePlugin, { recommendedRefs as fileSizeRecommendedRefs } from './file-size.plugin';

   export default {
     // ...
     categories: [
       // ...
       {
         slug: 'performance',
         title: 'Performance',
         refs: [...fileSizeRecommendedRefs],
       },
     ],
   };
   ```

5. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## Audits

Detailed information about the audits can be found in the docs folder of the plugin.

The following audits are present:

- [file-size-unmodified](@TODO link to docs/file-size-unmodified.audit.md)
