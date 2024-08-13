# Autorun Executor

This executor is used to run the code-pushup CLI autorun command in a Nx workspace.
For details on the CLI command read the [CLI autorun documentation](https://github.com/code-pushup/cli/blob/main/packages/cli/README.md#autorun-command).

#### @code-pushup/nx-plugin:autorun

## Usage

// project.json

```json
{
  "name": "my-project",
  "targets": {
    "code-pushup": {
      "executor": "@code-pushup/nx-plugin:autorun"
    }
  }
}
```

By default, the Nx plugin will derive the options from the executor config.

The following things happen:

- the output directory defaults to `${workspaceRoot}/.code-pushup/${projectName}`
- the config file defaults to `${projectRoot}/code-pushup.config.ts`
- parses terminal arguments and forwards them to the CLI command (they override the executor config)
- the CLI command is executed

```jsonc
{
  "name": "my-project",
  "targets": {
    "code-pushup": {
      "executor": "@code-pushup/nx-plugin:autorun",
      "options": {
        "projectPrefix": "cli", // upload.project = cli-my-project
        "verbose": true,
        "progress": false
        // persist and upload options as defined in CoreConfig
      }
    }
  }
}
```

Show what will be executed without actually executing it:

`nx run my-project:code-pushup --dryRun`

## Options

| Name              | type      | description                                                        |
| ----------------- | --------- | ------------------------------------------------------------------ |
| **projectPrefix** | `string`  | prefix for upload.project on non root projects                     |
| **dryRun**        | `boolean` | To debug the executor, dry run the command without real execution. |
| **bin**           | `string`  | Path to Code PushUp CLI                                            |

For all other options see the [CLI autorun documentation](../../cli/packages/cli/README.md#autorun-command).
