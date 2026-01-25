# Configuration Generator

#### @zod2md/nx-plugin:configuration

## Usage

`nx generate @zod2md/nx-plugin:configuration`

By default, the Nx plugin will search for existing configuration files. If they are not present it creates a `zod2md.config.ts` and adds a target to your `project.json` file.

You can specify the project explicitly as follows:

`nx g @zod2md/nx-plugin:configuration <project-name>`

```text
Root/
├── project-name/
│   ├── project.json 👈 updated
│   ├── zod2md.config.ts 👈 generated
│   └── ...
└── ...
```

Show what will be generated without writing to disk:

`nx g configuration ... --dry-run`

## Options

| Name              | type                        | description                                            |
| ----------------- | --------------------------- | ------------------------------------------------------ |
| **--project**     | `string` (REQUIRED)         | The name of the project.                               |
| **--targetName**  | `string` (DEFAULT 'zod2md') | The id used to identify a target in your project.json. |
| **--bin**         | `string`                    | Path to Code PushUp CLI                                |
| **--skipProject** | `boolean` (DEFAULT false)   | Skip adding the target to `project.json`.              |
| **--skipConfig**  | `boolean` (DEFAULT false)   | Skip adding the `zod2md.config.ts` to project root.    |
