# Init Generator

#### @code-pushup/nx-plugin:init

## Usage

`nx generate configuration ...`

By default, the Nx plugin will update your `package.json` with needed dependencies and register the plugin in your `nx.json` configuration.

You can specify the collection explicitly as follows:

`nx g @code-pushup/nx-plugin:init`

Show what will be generated without writing to disk:

`nx g @code-pushup/nx-plugin:init --dry-run`

## Options

| Name                  | type                        | description                                 |
| --------------------- | --------------------------- | ------------------------------------------- |
| **--skipPackageJson** | `boolean` (DEFAULT `false`) | Skip adding `package.json` dependencies.    |
| **--skipNxJson**      | `boolean` (DEFAULT `false`) | Skip updating `nx.json` with configuration. |
