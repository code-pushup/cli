# @code-pushup/nx-plugin

### Plugin

Register this plugin in your `nx.json` to leverage a set of generators and executors to integrate Code PushUp into a Nx workspace.

#### Registration

```jsonc
// nx.json
{
  //...
  "plugins": ["@code-pushup/nx-plugin"],
}
```

Resulting targets:

- `nx run <project-name>:code-pushup--configuration` (no config file present)
- `nx run <project-name>:code-pushup` (`code-pushup.config.{ts,mjs,js}` is present)

### Generators

#### Init

Install JS packages and register plugin.
See [init generator docs](./src/generators/init/README.md) for details

Examples:

- `nx g @code-pushup/nx-plugin:init` - setup code-pushup in the workspace
- `nx g @code-pushup/nx-plugin:init  --skipPackageJson` - skip `package.json` update

#### Configuration

Adds a `code-pushup` target to your `project.json`.
See [configuration generator docs](./src/generators/configuration/README.md) for details

Examples:

- `nx g @code-pushup/nx-plugin:configuration --project=<project-name>`
- `nx g @code-pushup/nx-plugin:configuration --project=<project-name> --targetName=cp`

### Executor

#### CLI

Install JS packages configure a target in your project json.
See [CLI executor docs](./src/executors/cli/README.md) for details

Examples:

```json
{
  "name": "my-project",
  "targets": {
    "code-pushup": {
      "executor": "@code-pushup/nx-plugin:cli",
      "options": {
        "projectPrefix": "workspace-name"
      }
    }
  }
}
```

- `nx run <project-name>:code-pushup`
- `nx run <project-name>:code-pushup print-config --persist.filename=custom-report`

> ℹ️ This plugin supports both V1 and V2 plugin strategies. When installed in an Nx workspace using Nx 18 or later, the executors will be automatically inferred. Learn more about inferred tasks [here](https://nx.dev/concepts/inferred-tasks).
