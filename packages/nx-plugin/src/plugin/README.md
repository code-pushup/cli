# @code-pushup/nx-plugin

The Nx Plugin for CodePushup, an open source code quality and conformance tool.

Why should you use this plugin?

- Zero setup cost. Just run the `init` generator and you're good to go.
- Smoother CI integration
- Minimal configuration
- Automated setup, migration and maintenance

## Usage

```jsonc
// nx.json
{
  //...
  "plugins": ["@code-pushup/nx-plugin"]
}
```

or with options:

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "@code-pushup/nx-plugin",
      "options": {
        "projectPrefix": "cli"
      }
    }
  ]
}
```

Now every project will have `code-pushup--configuration` target if no `code-pushup.{ts,mjs,js}` is present.

- `nx run <project-name>:code-pushup--configuration`
- `nx run <project-name>:code-pushup--configuration  --skipFormat`

Run it and the project will get automatically configured.

```text
Root/
├── project-name/
│   ├── code-pushup.config.ts 👈 generated
│   └── ...
└── ...
```

For details visit the [configuration generator docs](../../src/generators/configuration/README.md).

With the configuration from above a `code-pushup` target is now present.

- `nx run <project-name>:code-pushup`

Run it and the project will get automatically collect the report.

```text
Root/
├── .code-pushup/
│   └── project-name
│       ├── report.md 👈 generated
│       └── report.json 👈 generated
├── project-name/
│   ├── code-pushup.config.ts
│   └── ...
└── ...
```

Pass positional arguments to execute a specific command, use named arguments to overwrite defaults.

- `nx run <project-name>:code-pushup --onlyPlugins=eslint`
- `nx run <project-name>:code-pushup collect`
- `nx run <project-name>:code-pushup upload --upload.server=https://staging.code-pushup.dev`

For a full list of command visit the [CodePushup CLI documentation](../../../cli/README.md#commands).

## Options

| Name              | type                             | description                                            |
| ----------------- | -------------------------------- | ------------------------------------------------------ |
| **projectPrefix** | `string`                         | prefix for upload.project on non root projects         |
| **targetName**    | `string` (DEFAULT 'code-pushup') | The id used to identify a target in your project.json. |
| **bin**           | `string`                         | Path to Code PushUp CLI                                |

All options are optional and provided in the `nx.json` file.

```jsonc
// nx.json
{
  //...
  "plugins": [
    {
      "plugin": "@code-pushup/nx-plugin",
      "options": {
        "projectPrefix": "cli"
        "targetName": "cp"
        "bin": "dist/package/code-pushup-custom-build"
      }
    }
  ]
}
```
