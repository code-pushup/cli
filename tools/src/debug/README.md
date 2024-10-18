# DEBUG Nx Plugin

A plugin that provides a set of tools to debug your Nx workspace.

## Usage

Register the plugin in your `nx.json`

```jsonc
// nx.json
{
  //...
  "plugins": ["tools/src/debug/debug.plugin.ts"],
}
```

### Options

You can configure the plugin by providing options object in addition to the plugin path

**Options:**

| Name       | Type     | Default                     | Description               |
| ---------- | -------- | --------------------------- | ------------------------- |
| `tsconfig` | `string` | `tools/tsconfig.tools.json` | The tsconfig file to use. |

Example:

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "tools/src/debug/debug.plugin.ts",
      "options": {
        "tsconfig": "tools/tsconfig.tools.json",
      },
    },
  ],
}
```

### Targets

#### `list-process`

Lists all the processes running in the workspace.

Options:

| Name            | Type     | Default     | Description                  |
| --------------- | -------- | ----------- | ---------------------------- |
| `pidFilter`     | `number` | `undefined` | Filter processes by PID.     |
| `commandFilter` | `string` | `undefined` | Filter processes by command. |
| `slice`         | `number` | `undefined` | Slice the list of processes. |

Example:

- `nx run <project-name>:list-process`
- `nx run <project-name>:list-process --pidFilter=1234`
- `nx run <project-name>:list-process --commandFilter=verdaccio`
- `nx run <project-name>:list-process --commandFilter=verdaccio --pidFilter=1234`
- `nx run <project-name>:list-process --commandFilter=verdaccio --slice=5`

#### `kill-process`

Kills a process by its PID or filter

Options:

| Name            | Type     | Default     | Description                  |
| --------------- | -------- | ----------- | ---------------------------- |
| `pidFilter`     | `number` | `undefined` | Filter processes by PID.     |
| `commandFilter` | `string` | `undefined` | Filter processes by command. |

Example:

- `nx run <project-name>:kill-process --pidFilter=1234`
- `nx run <project-name>:kill-process --commandFilter=verdaccio`

## Scripts

### `list-process.ts`

Lists all the processes running in the workspace.

Options:

| Name            | Type     | Default     | Description                  |
| --------------- | -------- | ----------- | ---------------------------- |
| `pidFilter`     | `number` | `undefined` | Filter processes by PID.     |
| `commandFilter` | `string` | `undefined` | Filter processes by command. |
| `slice`         | `number` | `undefined` | Slice the list of processes. |

Example:

- `tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/list-process.ts`
- `tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/list-process.ts --pidFilter=1234`
- `tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/list-process.ts --commandFilter=verdaccio`

### `kill-process.ts`

Kills a process by its PID or command string.

Options:

| Name            | Type      | Default     | Description                  |
| --------------- | --------- | ----------- | ---------------------------- |
| `pidFilter`     | `number`  | `undefined` | Filter processes by PID.     |
| `commandFilter` | `string`  | `undefined` | Filter processes by command. |
| `slice`         | `number`  | `undefined` | Slice the list of processes. |
| `verbose`       | `boolean` | `undefined` | Log the process to kill.     |

Example:

- `tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/kill-process.ts --pidFilter=1234`
- `tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/kill-process.ts --commandFilter=verdaccio --pidFilter=1234`
- `tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/kill-process.ts --commandFilter=verdaccio --pidFilter=1234 --verbose`

### `clean-npmrc.ts`

Cleans the `.npmrc` file in the workspace.

Options:

| Name         | Type                   | Default | Description                                   |
| ------------ | ---------------------- | ------- | --------------------------------------------- |
| `userconfig` | `string`               | none    | The path to the `.npmrc` file.                |
| `entryMatch` | `string` \| `string[]` | none    | The entries to remove from the `.npmrc` file. |

Example:

- `tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/clean-npmrc.ts --entryMatch=secretVerddacioToken`
- `tsx --tsconfig=tools/tsconfig.tools.json tools/src/debug/bin/clean-npmrc.ts --userconfig=.npmrc --entryMatch=secretVerddacioToken`

Log npm config settings:

- `npm config list`
- `npm config list -l`
- `npm config list -l --location=global`
- `npm config list -l --userconfig=path/to/file.npmrc`
