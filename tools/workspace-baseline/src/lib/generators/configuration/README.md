# Configuration Generator

#### @code-pushup/workspace-baseline:configuration

## Usage

`nx generate @code-pushup/workspace-baseline:configuration --project=my-project --targetName=tools`

By default, the generator creates a TypeScript configuration file (`tsconfig.{targetName}.json`) in the project root. If a file with the same name already exists, the generator will skip creation and log a warning.

You can specify the project explicitly as follows:

`nx g @code-pushup/workspace-baseline:configuration <project-name> --targetName=tools`

```text
Root/
├── project-name/
│   ├── tsconfig.tools.json 👈 generated
│   └── ...
└── ...
```

Show what will be generated without writing to disk:

`nx g @code-pushup/workspace-baseline:configuration <project-name> --targetName=tools --dry-run`

## Options

| Name             | type                      | description                                                                         |
| ---------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| **--project**    | `string` (REQUIRED)       | The name of the project.                                                            |
| **--targetName** | `string` (REQUIRED)       | The basename for the tsconfig file (e.g., "tools" generates `tsconfig.tools.json`). |
| **--skipConfig** | `boolean` (DEFAULT false) | Skip adding the `tsconfig.{targetName}.json` to project root.                       |
| **--skipFormat** | `boolean` (DEFAULT false) | Skip formatting of changed files.                                                   |
