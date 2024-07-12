# @code-pushup/nx-plugin

### Generators

#### Init

Install JS packages and register plugin.
See [init docs](./src/generators/init/README.md) for details

Examples:

- `nx g @code-pushup/nx-plugin:init` - setup code-pushup in the workspace
- `nx g @code-pushup/nx-plugin:init  --skipPackageJson` - skip `package.json` update

#### Configuration

Adds a `code-pushup` target to your `project.json`.
See [configuration docs](./src/generators/configuration/README.md) for details

Examples:

- `nx g @code-pushup/nx-plugin:configuration --project=<project-name>`
- `nx g @code-pushup/nx-plugin:configuration --project=<project-name> --targetName=cp`
