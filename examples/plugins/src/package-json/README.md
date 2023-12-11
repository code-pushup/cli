# package-json-plugin

🕵️ **Code PushUp plugin for evaluating `package.json` configurations** 📦

---

The plugin crawls the file base depending on your configuration and reports about their containing `package.json` files`.

You can configure the plugin with the following options:

- `directory` - directory to crawl as string
- `license` - file name pattern as string
- `type` - size budget as number in bytes
- `dependencies` - package dependencies as object
- `devDependencies` - package dependencies as object
- `optionalDependencies` - package dependencies as object

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Copy the [plugin source](../file-size) as is into your project

   3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

      Pass in the path or the directory to crawl (relative to `process.cwd()`).

      ```js
      import packageJsonPlugin from './package-json.plugin';

      export default {
        // ...
        plugins: [
          // ...
          packageJsonPlugin({
            directory: 'dist',
            license: 'MIT',
            type: 'module',
            dependencies: {
              packge1: '0.0.1',
            },
            devDependencies: {
              packge2: '0.0.1',
            },
            optionalDependencies: {
              packge3: '0.0.1',
            },
          }),
        ],
      };
      ```

3. (Optional) Reference audits (or groups) which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   Assign weights based on what influence each audit and group should have on the overall category score (assign weight 0 to only include it for extra info, without influencing the category score).

   ```js
   import packageJsonPlugin, { packageJsonDocumentationGroupRef, packageJsonPerformanceGroupRef, packageJsonVersionControlGroupRef } from './file-size.plugin';

   export default {
     // ...
     categories: [
       // ...
       {
         slug: 'bug-prevention',
         title: 'Bug prevention',
         refs: [packageJsonVersionControlGroupRef],
       },
       {
         slug: 'performance',
         title: 'Performance',
         refs: [packageJsonPerformanceGroupRef],
       },
       {
         slug: 'documentation',
         title: 'Documentation',
         refs: [packageJsonDocumentationGroupRef],
       },
     ],
   };
   ```

4. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## Audits

Detailed information about the audits can be found in the docs folder of the plugin.

The following audits are present:

**Documentation**:

- [package-json-license](@TODO - link to docs/package-json-license.audit.md)

**Performance**:

- [package-json-type](@TODO - link to docs/package-json-type.audit.md)

**Bug Prevention**:

- [package-json-dependencies](@TODO - link to docs/package-json-dependencies.audit.md)

## Groups

Preconfigured groups are available

The following groups can be referenced are present:

- [`packageJsonVersionControlGroupRef`](@TODO - link to line of code)
- [`packageJsonPerformanceGroupRef`](@TODO - link to line of code)
- [`packageJsonVersionControlGroupRef`](@TODO - link to line of code)
