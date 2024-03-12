# knip

🕵️ **Code PushUp plugin for detecting unused code** 📋

---

The plugin crawls the file base depending on your configuration and reports about their state.
It maintains a set of audits


You can configure the plugin with the following options:

- ???

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Copy the [plugin source](../file-size) as is into your project

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

   Pass in the path on the directory to crawl (relative to `process.cwd()`), as well as patterns and a budget.

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

4. (Optional) Reference audits (or groups) that you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

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
Audits are derived form knips [issue types](https://knip.dev/reference/issue-types).


**Legend**
- Description
  - 🔧	Auto-fixable issue types
  - 🟠	Not included by default (include with filters)


**Table of Audits**

| Title                                                                                        | Description                                                                     | Icon | Key            |
|----------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------|------|----------------|
| [Unused files](./docs/unused-files.audit.md)                                                 | Unable to find a reference to this file                                         |      | files          |
| [Unused dependencies](./docs/unused-dependencies.audit.md)                                   | Unable to find a reference to this dependency                                   | 🔧   | dependencies   |
| [Unused devDependencies](./docs/unused-devDependencies.audit.md)                             | Unable to find a reference to this devDependency                                | 🔧   | dependencies   |
| [Referenced optional peerDependencies](./docs/referenced-optional-peerDependencies.audit.md) | Optional peer dependency is referenced                                          |      | dependencies   |
| [Unlisted dependencies](./docs/unlisted-dependencies.audit.md)                               | Used dependencies not listed in package.json                                    |      | unlisted       |
| [Unlisted binaries](./docs/unlisted-binaries.audit.md)                                       | Binaries from dependencies not listed in package.json                           |      | binaries       |
| [Unresolved imports](./docs/unresolved-imports.audit.md)                                     | Unable to resolve this (import) specifier                                       |      | unresolved     |
| [Unused exports](./docs/unused-exports.audit.md)                                             | Unable to find a reference to this export                                       | 🔧   | exports        |
| [Unused exported types](./docs/unused-exported-types.audit.md)                               | Unable to find a reference to this exported type                                | 🔧   | types          |
| [Exports in used namespace](./docs/exports-in-used-namespace.audit.md)                       | Namespace with export is referenced, but not export itself                      | 🟠   | nsExports      |
| [Exported types in used namespace](./docs/exported-types-in-used-namespace.audit.md)         | Namespace with type is referenced, but not type itself                          | 🟠   | nsTypes        |
| [Unused exported enum members](./docs/unused-exported-enum-members.audit.md)                 | Unable to find a reference to this enum member                                  |      | enumMembers    |
| [Unused exported class members](./docs/unused-exported-class-members.audit.md)               | Unable to find a reference to this class member                                 | 🟠   | classMembers   |
| [Duplicate exports](./docs/duplicate-exports.audit.md)                                       | This is exported more than once                                                 |      | duplicates     |

