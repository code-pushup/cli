# knip

🕵️ **Code PushUp plugin for detecting unused code** 📋

---

## Getting started

1. If you haven't already, install [@code-pushup/cli](../cli/README.md) and create a configuration file.

2. Copy the [plugin source](../knip) as is into your project

3. Add this plugin to the `plugins` array in your Code PushUp CLI config file (e.g. `code-pushup.config.js`).

   Pass in the path on the directory to crawl (relative to `process.cwd()`), as well as patterns and a budget.

   ```js
   import knipPlugin from './knip.plugin';

   export default {
     // ...
     plugins: [
       // ...
       knipPlugin({}),
     ],
   };
   ```

See a detailed guide on how to configure knip on their [official docs](https://knip.dev/guides/handling-issues)

4. (Optional) Reference audits (or groups) that you wish to include in custom categories (use `npx code-pushup print-config` to list audits and groups).

   Assign weights based on what influence each audit and group should have on the overall category score (assign weight 0 to only include it for extra info, without influencing the category score).

   ```js
   import { knipCategoryGroupRef, knipCategoryAuditRef } from './knip/index.ts';

   export default {
     // ...
     categories: [
       // ...
       {
         slug: 'performance',
         title: 'Performance',
         refs: [...knipCategoryRefs],
       },
     ],
   };
   ```

5. Run the CLI with `npx code-pushup collect` and view or upload report (refer to [CLI docs](../cli/README.md)).

## Plugin Options

[knip cli docs](https://knip.dev/reference/cli)

## Configuration

Knip should have a default configuration and therefore works without any config file. However, every project has its own style of organizing contextual files not directly related to the core logic (tooling, testing, measurement).
In such cases you have to [configure knip](https://knip.dev/overview/configuration) to align with your project.

Create a `knip.config.ts` with the following content:

```ts

```

This file will automatically pick up by knip. See [location docs](https://knip.dev/overview/configuration#location) for details.

Go on with customizing your `knip.config.ts` until the results look good to you. See [customize knip config](https://knip.dev/overview/configuration#customize) for details.

## Configuration fo Nx

In many cases projects use `Nx` to manage their single- or mono-repository.  
This section covers approaches for a Nx setup.

### use @beaussan/nx-knip helper

Basic setup using he nx helper [`@beaussan/nx-knip`](https://github.com/beaussan/nx-tools/tree/main/packages/nx-knip).

We would have to add quite some rules to the configuration file doing the setup manually:

```ts
export default {
  entry: [
    'libs/lib-1/vitest.*.config.ts',
    // ...
    'libs/lib-1/eslint.*.config.ts',
    // ...
  ],
  project: [
    'libs/lib-1/src/**/*.ts',
    // ...
    'apps/app-1/src/**/*.ts',
    // ...
  ],
};
```

With the helper it looks like this:

```ts
import { combineNxKnipPlugins, withEsbuildApps, withEsbuildPublishableLibs, withEslint, withLocalNxPlugins, withNxTsPaths, withVitest } from '@beaussan/nx-knip';

export default combineNxKnipPlugins(withNxTsPaths(), withLocalNxPlugins({ pluginNames: ['nx-plugin'] }), withEsbuildApps(), withEsbuildPublishableLibs(), withVitest(), withEslint());
```

### create custom helper with @beaussan/nx-knip

```ts
export const withCustomNxStandards = (): KnipConfigPlugin => () => {
  return {
    project: ['**/*.{ts,js,tsx,jsx}'],
    ignore: ['tmp/**', 'node_modules/**'],
    entry: [
      // missing knip plugin for now, so this is in the root entry
      'code-pushup.config.ts',
      'tools/**/*.{js,mjs,ts,cjs,mts,cts}',
    ],
    ignoreDependencies: [
      'prettier',
      // this is used in a test for a case where we reference a non existing plugin
      '@example/custom-plugin',
    ],
  };
};

export default combineNxKnipPlugins(
  // ...
  withCustomNxStandards(),
);
```

## Audits

Detailed information about the audits can be found in the docs folder of the plugin.
Audits are derived form knip's [issue types](https://knip.dev/reference/issue-types).

**Legend**

- Description
  - 🔧 Auto-fixable issue types
  - 🟠 Not included by default (include with filters)
  - 📄 Source file given
  - 📍 Position oin file given

**Table of Audits**

| Title                                                                                                      | Description                                                | Default On | Key          | Source | Position | Fixable |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- | ------------ | ------ | -------- | ------- |
| [Unused files](https://knip.dev/guides/handling-issues#unused-files)                                       | Unable to find a reference to this file                    |            | files        | 📄     |          |         |
| [Unused dependencies](https://knip.dev/guides/handling-issues#unused-dependencies)                         | Unable to find a reference to this dependency              |            | dependencies |        |          | 🔧      |
| [Unused devDependencies](https://knip.dev/guides/handling-issues#unused-dependencies)                      | Unable to find a reference to this devDependency           |            | dependencies |        |          | 🔧      |
| [Unlisted dependencies](https://knip.dev/guides/handling-issues#unlisted-dependencies)                     | Used dependencies not listed in package.json               |            | unlisted     | 📄     | 📍       |         |
| [Unlisted binaries](https://knip.dev/guides/handling-issues)                                       | Binaries from dependencies not listed in package.json      |            | binaries     | 📄     | 📍       |         |
| [Referenced optional peerDependencies](https://knip.dev/guides/handling-issues#referenced-optional-peerDependencies) | Optional peer dependency is referenced                     |            | dependencies | 📄     | 📍       |         |
| [Unresolved imports](https://knip.dev/guides/handling-issues#unresolved-imports)                           | Unable to resolve this (import) specifier                  |            | unresolved   | 📄     | 📍       |         |
| [Unused exports](https://knip.dev/guides/handling-issues#unused-exports)                                   | Unable to find a reference to this export                  |            | exports      | 📄     | 📍       | 🔧      |
| [Unused exported types](https://knip.dev/guides/handling-issues#unused-exports)                            | Unable to find a reference to this exported type           |            | types        | 📄     | 📍       | 🔧      |
| [Exports in used namespace](https://knip.dev/guides/handling-issues#unused-exports)                        | Namespace with export is referenced, but not export itself | 🟠         | nsExports    | 📄     | 📍       |         |
| [Exported types in used namespace](https://knip.dev/guides/handling-issues#unused-exports)                 | Namespace with type is referenced, but not type itself     | 🟠         | nsTypes      | 📄     | 📍       |         |
| [Unused exported enum members](https://knip.dev/guides/handling-issues#enum-members)                       | Unable to find a reference to this enum member             |            | enumMembers  | 📄     | 📍       |         |
| [Unused exported class members](https://knip.dev/guides/handling-issues#class-members)                     | Unable to find a reference to this class member            | 🟠         | classMembers | 📄     | 📍       |         |
| [Duplicate exports](https://knip.dev/guides/handling-issues)                                               | This is exported more than once                            |            | duplicates   | 📄     | 📍       |         |

## Troubleshooting

### Read the official documentation

First you should get familiar with the official docs of knip:

- [configuration](https://knip.dev/overview/configuration)
- [troubleshooting](https://knip.dev/guides/troubleshooting)

### List dependency references for a specific package

To list where your dependencies is used run the following command:

```
// list dependencies for certain package
npm list <package-name>
// alias
npm ls <package-name>
```

running `npm list jsonc-eslint-parser` could print the following:

-

```bash
@code-pushup/cli-source@0.29.0 /Users/name/projects/project-name
└─┬ @nx/eslint-plugin@17.3.2
  └── jsonc-eslint-parser@2.4.0
```

This would mean that `jsonc-eslint-parser` is a sub dependency of `@nx/eslint-plugin` but not listed as dependency in your `package.json`.

-

```bash
├─┬ @nx/eslint-plugin@17.3.2
│ └── jsonc-eslint-parser@2.4.0 deduped
└── jsonc-eslint-parser@2.4.0
```

This would mean that `jsonc-eslint-parser` is a sub dependency of `@nx/eslint-plugin` and is listed as dependency in your `package.json`.
