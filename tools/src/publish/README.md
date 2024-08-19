# Publish Nx Plugin

A Nx plugin that adds targets that help to publish packages to NPM.

## Usage

Register the plugin in your `nx.json`

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": ["tools/publish/publish.plugin.ts"]
}
```

### Options

You can configure the plugin by providing options object in addition to the plugin path

**Options:**

| Name                 | Type                   | Default                     | Description                                     |
| -------------------- |------------------------|-----------------------------| ----------------------------------------------- |
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
        "publishableTargets": ["add-to-npm-registry"]
      }
    }
  ]
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
| `verbose`     | `boolean` | `false`  | Log additional information.                                          |
| `directory`   | `string`  |          | The directory to publish. (location of the build artefact e.g. dist) |
