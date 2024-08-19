# TODO

Add post target

```jsonc
'post-registry': {
      dependsOn: [
        ...targets.map(target => ({
          projects: 'self',
          target,
        })),
      ],
      command: `echo POST E2E - stop verdaccio on port ${port}`,
    },
```

Move verdaccio targets into every project that has a e2e target

```typescript

    const hasPreVerdaccioTargets = someTargetsPresent(projectConfiguration?.targets ?? {}, preTargets);
    if (!hasPreVerdaccioTargets) {
      return {};
    }

```

# Verdaccio Nx Plugin

A Nx plugin that adds targets that help to test packages published to a package registry like NPM.
It uses Verdaccio to start a local registry and test the package against it.
This helps to catch tricky bugs before publishing the package to the public registry.

## Usage

Register the plugin in your `nx.json`

```jsonc
// nx.json
{
  "name": "my-project",
  "plugins": ["tools/verdaccio/verdaccio.plugin.ts"]
}
```

### Options

You can configure the plugin by providing a options object in addition to the plugin path

| Name       | Type      | Default                         | Description                                |
| ---------- | --------- | ------------------------------- | ------------------------------------------ |
| `verbose`  | `boolean` | `false`                         | Log additional information.                |
| `tsconfig` | `string`  | `tools/tsconfig.tools.json`     | The tsconfig file to use.                  |
| `port`     | `number`  | `4873`                          | The port to start the Verdaccio server on. |
| `config`   | `string`  | `tools/verdaccio/verdaccio.yml` | The Verdaccio configuration file.          |
| `storage`  | `string`  | `tools/verdaccio/storage`       | The storage directory for Verdaccio.       |

Example:

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "tools/verdaccio/verdaccio.plugin.ts",
      "options": {
        "tsconfig": "tools/tsconfig.tools.json",
        "verbose": true
      }
    }
  ]
}
```

### Targets

> [!NOTE]
> By default target are only added to projects with a `e2e` target configured.

#### `start-verdaccio`

Starts a Verdaccio server.

It will automatically use `tools/tsconfig.tools.ts` to execute the script as well as derives the package name from the project name from `package/root/package.json`.
By default, it registers the latest version of the package from the default registry.

Run:
`nx run <project-name>:start-verdaccio`

**Options:**

| Name       | Type     | Default                         | Description                                        |
| ---------- | -------- | ------------------------------- | -------------------------------------------------- |
| `registry` | `string` | `https://registry.npmjs.org`    | The registry to check the package version against. |
| `config`   | `string` | `tools/verdaccio/verdaccio.yml` | The Verdaccio configuration file.                  |
| `port`     | `number` | generated uniquePort            | The port to start the Verdaccio server on.         |
| `storage`  | `string` | `tmp/e2e/storage `              | The storage directory for Verdaccio.               |
