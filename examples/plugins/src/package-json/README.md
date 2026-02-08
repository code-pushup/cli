# package-json-plugin

🕵️ **Code PushUp plugin for evaluating `package.json` configurations** 📦

---

The plugin crawls the file base depending on your configuration and checks the content `package.json` files.

You can configure the plugin with the following options:

- `directory` - directory to crawl as string
- `license` - expected value of [`license` property in `package.json`](https://docs.npmjs.com/cli/configuring-npm/package-json#license)
- `type` - expected value of [`type` property in `package.json`](https://nodejs.org/api/packages.html#type)
- `dependencies` - package dependencies as object
- `devDependencies` - package dependencies as object
- `optionalDependencies` - package dependencies as object

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Copy the [plugin source](../package-json) as is into your project
   1. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

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
              package1: '0.0.1',
            },
            devDependencies: {
              package2: '0.0.1',
            },
            optionalDependencies: {
              package3: '0.0.1',
            },
          }),
        ],
      };
      ```

3. (Optional) Reference audits (or groups) which you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   Assign weights based on what influence each audit and group should have on the overall category score (assign weight 0 to only include it for extra info, without influencing the category score).

Use the recommendedRefs as quick starting point:

```js
import packageJsonPlugin, { recommendedRefs } from './package-json.plugin';

export default {
  // ...
  categories: [
    // ...
    {
      slug: 'package-json',
      title: 'Package Json',
      refs: [...recommendedRefs],
    },
  ],
};
```

Or set up more fine-grained categories over the exported group references:

```js
import packageJsonPlugin, { packageJsonDocumentationGroupRef, packageJsonPerformanceGroupRef, packageJsonVersionControlGroupRef } from './package-json.plugin';

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

- [package-json-license](./docs/license.audit.md)

**Performance**:

- [package-json-type](./docs/type.audit.md)

**Bug Prevention**:

- [package-json-dependencies](./docs/dependencies.audit.md)

## Helper

You can use the following exports:

### Constants:

- [`packageSlug`](./src/constants.ts#L5)
- [`audits`](./src/constants.ts#L6)

### References:

Preconfigured audit and group references are available

The following groups can be referenced are present:

- [`reccomendedRefs`](./src/scoring.ts#L65)
- [`packageJsonVersionControlGroupRef`](./src/scoring.ts#L20)
- [`packageJsonPerformanceGroupRef`](./src/scoring.ts#L39)
- [`packageJsonVersionControlGroupRef`](./src/scoring.ts#L58)
