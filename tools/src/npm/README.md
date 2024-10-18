# TODO

Reduce file interactions:
https://docs.npmjs.com/cli/v8/commands/npm-install#package-lock
`--no-package-lock`

Reduce target install folder
https://docs.npmjs.com/cli/v8/commands/npm-install#global (explains the prefix flag)
`--prefix=${join('tmp',packageName,'node_modules')}`

# NPM Nx Plugin

A Nx plugin that adds targets that help to work with packages published to NPM.

## Usage

Register the plugin in your `nx.json`

```jsonc
// nx.json
{
  //...
  "plugins": ["tools/npm/npm.plugin.ts"],
}
```

### Options

You can configure the plugin by providing options object in addition to the plugin path

**Options:**

| Name                 | Type                   | Default                     | Description                                     |
| -------------------- | ---------------------- | --------------------------- | ----------------------------------------------- |
| `verbose`            | `boolean`              | `false`                     | Log additional information.                     |
| `tsconfig`           | `string`               | `tools/tsconfig.tools.json` | The tsconfig file to use.                       |
| `npmCheckScript`     | `string`               | `check-package-range.ts`    | The script to execute when checking a package.  |
| `publishableTargets` | `string` or `string[]` | `["publishable"]`           | The targets that mark a project as publishable. |

Example:

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "tools/npm/npm.plugin.ts",
      "options": {
        "tsconfig": "tools/tsconfig.tools.json",
        "npmCheckScript": "check-package-range.ts",
        "publishableTargets": ["add-to-npm-registry"],
      },
    },
  ],
}
```

### Nx tags

> [!NOTE]
> A project can be marked as publishable using `tags` in `project.json`.
> Default tag name is `publishable`.

#### `npm-check`

Added dynamically to every project that is publishable (has a target named `publishable`).
Checks if a given package is registered in a given registry.

It will automatically use `tools/tsconfig.tools.ts` to execute the script as well as derives the package name from the project name from `package/root/package.json`.
By default, it registers the latest version of the package from the default registry.

Run:
`nx run <project-name>:npm-check`

**Options:**

| Name         | Type     | Default                      | Description                                        |
| ------------ | -------- | ---------------------------- | -------------------------------------------------- |
| `pkgVersion` | `string` | `latest`                     | The package version to check.                      |
| `registry`   | `string` | `https://registry.npmjs.org` | The registry to check the package version against. |

Examples:

- `nx run <project-name>:npm-check`
- `nx run <project-name>:npm-check --registry=http://localhost:58999`
- `nx run <project-name>:npm-check --registry=http://localhost:58999 --pkgVersion=1.0.0`

#### `npm-install`

Added dynamically to every project that is publishable (has a target named `publishable`).
Installs a given package version from a given registry.

It will automatically derive the package name from the project name from `package/root/package.json`.
By default, it installs the latest version of the package from the default registry.

Run:
`nx run <project-name>:npm-install`

**Options:**

| Name         | Type     | Default                      | Description                               |
| ------------ | -------- | ---------------------------- | ----------------------------------------- |
| `pkgVersion` | `string` | `latest`                     | The package version to install.           |
| `registry`   | `string` | `https://registry.npmjs.org` | The registry to install the package from. |

Examples:

- `nx run <project-name>:npm-install`
- `nx run <project-name>:npm-install --pkgVersion=1.0.0`
- `nx run <project-name>:npm-install --pkgVersion=1.0.0 --registry=http://localhost:58999`

#### `npm-uninstall`

Added dynamically to every project that is publishable (has a target named `publishable`).
Uninstalls a given package.

By default, it uninstalls the latest version of the package from the package.json in your CWD.

Run:
`nx run <project-name>:npm-uninstall`

Examples:

- `nx run <project-name>:npm-uninstall`

## Scripts

### `check-package-range.ts`

Checks if a given package is registered in a given registry.

Run:
`tsx --tsconfig=tools/tsconfig.tools.json tools/npm/check-package-range.ts`

**Options:**

| Name         | Type     | Default                      | Description                                        |
| ------------ | -------- | ---------------------------- | -------------------------------------------------- |
| `pkgVersion` | `string` | `latest`                     | The package version to check.                      |
| `registry`   | `string` | `https://registry.npmjs.org` | The registry to check the package version against. |

Examples:

- `tsx --tsconfig=tools/tsconfig.tools.json tools/npm/check-package-range.ts`
- `tsx --tsconfig=tools/tsconfig.tools.json tools/npm/check-package-range.ts --registry=http://localhost:58999`
- `tsx --tsconfig=tools/tsconfig.tools.json tools/npm/check-package-range.ts --registry=http://localhost:58999 --pkgVersion=1.0.0`
