# @code-pushup/nx-plugin

### Generators

#### Init

Install JS packages and register plugin

Examples:

- `nx g @code-pushup/nx-plugin:init` - setup code-pushup in the workspace
- `nx g @code-pushup/nx-plugin:init  --skipPackageJson` - skip `package.json` update

#### Configuration

Adds a `code-pushup` target to your `project.json`

Examples:

- `nx g @code-pushup/nx-plugin:configuration --project=<project-name>`
- `nx g @code-pushup/nx-plugin:configuration --project=<project-name> --targetName=cp`
