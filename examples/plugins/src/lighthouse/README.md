# lighthouse-plugin

🕵️ **Code PushUp plugin for lighthouse reports** 🔥

---

The plugin analyses a given URL and creates a lighthouse audits.

You can configure the plugin with the following options:

- `url` - target to crawl
- `onlyAudits` - list of audits to run;
- `verbose` - boolean;
- `headless` - boolean;

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Copy the [plugin source](../lighthouse) as is into your project

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

   Pass in the path on the directory to crawl (relative to `process.cwd()`), as well as patterns and a budget.

   ```js
   import fileSizePlugin from './lighthouse.plugin';

   export default {
     // ...
     plugins: [
       // ...
       lighthousePlugin({
         url: 'https://example.com',
       }),
     ],
   };
   ```

4. (Optional) Reference audits (or groups) that you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   Assign weights based on what influence each audit and group should have on the overall category score (assign weight 0 to only include it for extra info, without influencing the category score).

   ```js
   import fileSizePlugin, { recommendedRefs as lighthouseRecommendedRefs } from './lighthouse.plugin';

   export default {
     // ...
     categories: [
       // ...
       {
         slug: 'performance',
         title: 'Performance',
         refs: [...lighthouseRecommendedRefs],
       },
     ],
   };
   ```

5. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## Audits

Detailed information about the audits can be found in the docs of [lighthouse](@TODO).
