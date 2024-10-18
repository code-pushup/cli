# TODO

- refactor version bumping
- reconsider latest version detection logic
- use executeProcess instead of execSync
- refactor targets to use objToCliArgs

# Publish Nx Plugin

A Nx plugin that adds targets that help to publish packages to NPM.

## Usage

Register the plugin in your `nx.json`

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": ["tools/publish/publish.plugin.ts"],
}
```

### Options

You can configure the plugin by providing options object in addition to the plugin path

**Options:**

| Name                 | Type                   | Default                     | Description                                     |
| -------------------- | ---------------------- | --------------------------- | ----------------------------------------------- |
| `verbose`            | `boolean`              | `false`                     | Log additional information.                     |
| `tsconfig`           | `string`               | `tools/tsconfig.tools.json` | The tsconfig file to use.                       |
| `publishScript`      | `string`               | `publish-package.ts`        | The script to execute when publishing.          |
| `publishableTargets` | `string` or `string[]` | `["publishable"]`           | The targets that mark a project as publishable. |

Example:

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": [
    {
      "plugin": "tools/publish/publish.plugin.ts",
      "options": {
        "tsconfig": "tools/tsconfig.tools.json",
        "publishScript": "publish-package.ts",
        "publishableTargets": ["add-to-npm-registry"],
      },
    },
  ],
}
```

### Targets

> [!NOTE]
> A project can be marked as publishable by adding an empty target named `publishable`.

#### `publish`

Added dynamically to every project that is publishable (has a target named `publishable`).
Publishes a package to a given registry.

It will automatically use `tools/tsconfig.tools.ts` to execute the script as well as derives the package name from the project name from `package/root/package.json`.
By default, it registers the latest version of the package from the default registry.

Run:
`nx run <project-name>:publish`

**Options:**

| Name         | Type     | Default                      | Description                             |
| ------------ | -------- | ---------------------------- | --------------------------------------- |
| `pkgVersion` | `string` | `latest`                     | The package version to publish.         |
| `registry`   | `string` | `https://registry.npmjs.org` | The registry to publish the package to. |

Examples:

- `nx run <project-name>:publish`
- `nx run <project-name>:publish --registry=http://localhost:58999`
- `nx run <project-name>:publish --registry=http://localhost:58999 --pkgVersion=1.0.0`

## Scripts

### `publish-package.ts`

The script that is executed when running the `publish` target.

Options:

| Name          | Type      | Default  | Description                                                          |
| ------------- | --------- | -------- | -------------------------------------------------------------------- |
| `nextVersion` | `string`  | `latest` | The version to publish.                                              |
| `tag`         | `string`  | `latest` | The tag to publish.                                                  |
| `registry`    | `string`  |          | The registry to publish the package to.                              |
| `directory`   | `string`  |          | The directory to publish. (location of the build artefact e.g. dist) |
| `verbose`     | `boolean` | `false`  | Log additional information.                                          |

Examples:

- `tsx tools/src/publish/bin/publish-package.ts`
- `tsx tools/src/publish/bin/publish-package.ts --directory=dist/packages/<package-name>`
- `tsx tools/src/publish/bin/publish-package.ts --directory=dist/packages/<package-name> --registry=http://localhost:58999 --nextVersion=1.0.0`

### `bump-package.ts`

This script is used to bump the version of the package. It will automatically update the version in the `package.json` file.

Options:

| Name          | Type      | Default         | Description                                                          |
| ------------- | --------- | --------------- | -------------------------------------------------------------------- |
| `directory`   | `string`  | `process.cwd()` | The directory to publish. (location of the build artefact e.g. dist) |
| `nextVersion` | `string`  |                 | The version to publish.                                              |
| `verbose`     | `boolean` | `false`         | Log additional information.                                          |

Examples:

- `tsx tools/src/publish/bin/bump-package.ts --nextVersion=<version-number>`
- `tsx tools/src/publish/bin/bump-package.ts --directory=dist/packages/<package-name> --nextVersion=<version-number>`

### `login-check.ts`

This script is used to check if the user is logged in to the NPM registry.

Options:

| Name       | Type      | Default                      | Description                 |
| ---------- | --------- | ---------------------------- | --------------------------- |
| `registry` | `string`  | `https://registry.npmjs.org` | The registry to check.      |
| `verbose`  | `boolean` | `false`                      | Log additional information. |

Examples:

- `tsx tools/src/publish/bin/login-check.ts`
- `tsx tools/src/publish/bin/login-check.ts --registry=http://localhost:58999`
- `tsx tools/src/publish/bin/login-check.ts --registry=http://localhost:58999 --verbose`
