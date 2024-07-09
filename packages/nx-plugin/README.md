# @code-pushup/nx-plugin

### Generators

#### Init

Install JS packages and register plugin.
See [init docs](./src/generators/init/Readme.md) for details

Examples:

- `nx g @code-pushup/nx-plugin:init` - setup code-pushup in the workspace
- `nx g @code-pushup/nx-plugin:init  --skipPackageJson` - skip `package.json` update

#### Configuration

Adds a `code-pushup` target to your `project.json`.
See [configuration docs](./src/generators/configuration/Readme.md) for details

Examples:

- `nx g @code-pushup/nx-plugin:configuration --project=<project-name>`
- `nx g @code-pushup/nx-plugin:configuration --project=<project-name> --targetName=cp`

### Executors

#### Autorun

Executes code-pushup autorun and provides Nx specific defaults.  
See [autorun docs](./src/executors/autorun/Readme.md) for details.

Examples:

```json
{
  "name": "my-project",
  "targets": {
    "autorun": {
      "executor": "@code-pushup/nx-plugin:autorun"
    }
  }
}
```

`npx nx run my-project:autorun --dryRun`
