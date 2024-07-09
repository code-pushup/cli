# Autorun Executor

#### @code-pushup/nx-plugin:autorun

## Usage

// project.json
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

By default, the Nx plugin will derive the options from the executor config.

The following things happen:
- the format defaults to ['json']
- the output directory defaults to `${projectRoot}/.code-pushup/${projectName}`
- the config file defaults to `${projectRoot}/code-pushup.config.ts`

- // autorun options in project.json

```json
{
  "name": "my-project",
  "targets": {
    "code-pushup": {
      "executor": "@code-pushup/nx-plugin:autorun",
      "options": {
        "projectPrefix": "my-project",
        "verbose": true,
        "progress": false
        // persist and upload options as defined in CoreConfig
      }
    }
  }
}
```

Show what will be executed without actually executing it:

`nx run my-project:autorun --dryRun`

## Options

| Name              | type        | description                                            |
|-------------------|-------------|--------------------------------------------------------|
| **projectPrefix** | `string`    | prefix for upload.project                              |
| CLI options       | -           | Persist and Upload options as defined in CoreConfig    |
