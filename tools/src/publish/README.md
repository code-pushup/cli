# Publish Nx Plugin

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

You can configure the plugin by providing a options object in addition to the plugin path:

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": [
    {
      "plugin": "tools/publish/publish.plugin.ts",
      "options": {
        "tsconfig": "tools/tsconfig.tools.json",
        "publishScript": "publish-package.ts"
      }
    }
  ]
}
```

### Targets

> [!NOTE]
> A project can be marked as publishable by adding a empty target named `publishable`.

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
- `nx run <project-name>:publish --registry=http://localhost:58999 --pkgVersion=1.0.0 --dryRun`
- `nx run <project-name>:publish --registry=http://localhost:58999 --pkgVersion=1.0.0 --dryRun --verbose`

## Scripts

### `publish-package.ts`

The script that is executed when running the `publish` target.

Options:

| Name         | Type      | Default  | Description                                               |
| ------------ | --------- | -------- | --------------------------------------------------------- |
| `pkgVersion` | `string`  | `latest` | The package version to publish.                           |
| `registry`   | `string`  |          | The registry to publish the package to .                  |
| `dryRun`     | `boolean` | `false`  | Show what will be executed without actually executing it. |
| `verbose`    | `boolean` | `false`  | Show more information about the execution.                |
