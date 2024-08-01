# Configuration Generator

#### @code-pushup/nx-plugin:configuration

## Usage

`nx generate configuration ...`

By default, the Nx plugin will search for existing configuration files. If they are not present it creates a `code-pushup.config.ts` and adds a target to your `project.json` file.

You can specify the collection explicitly as follows:

`nx g @code-pushup/nx-plugin:configuration ...`

Show what will be generated without writing to disk:

`nx g configuration ... --dry-run`

## Options

| Name              | type                             | description                                              |
| ----------------- | -------------------------------- | -------------------------------------------------------- |
| **--project**     | `string` (REQUIRED)              | The name of the project.                                 |
| **--targetName**  | `string` (DEFAULT 'code-pushup') | The id used to identify a target in your project.json.   |
| **--bin**         | `string`                         | Path to Code PushUp CLI                                  |
| **--skipProject** | `boolean` (DEFAULT false)        | Skip adding the target to `project.json`.                |
| **--skipConfig**  | `boolean` (DEFAULT false)        | Skip adding the `code-pushup.config.ts` to project root. |
