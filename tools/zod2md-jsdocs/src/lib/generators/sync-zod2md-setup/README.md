# Sync Zod2Md Setup Generator (Nx sync generator)

**Package:** `@tooling/zod2md-jsdocs`  
**Generator:** `sync-zod2md-setup`

---

## Usage

```bash
nx generate @tooling/zod2md-jsdocs:sync-zod2md-setup
```

The sync generator automatically targets **all projects that already contain a**
`zod2md.config.ts` file.

---

## What the generator does

For each matching project, the generator performs the following checks and fixes:

### 1. TypeScript configuration

- Searches for the **first existing** `tsconfig.*.json` file (e.g. `tsconfig.json`, `tsconfig.lib.json`)
- If found:
  - Verifies that the **Zod2Md TypeScript plugin options** are configured
  - Automatically patches the `tsconfig` file if options are missing or incorrect

---

### 2. Project configuration (`project.json`)

- Verifies the presence of a **Zod2Md docs target**
- Verifies that the `build` target has the correct `dependsOn` configuration
- If missing:
  - Adds the Zod2Md target
  - Updates `build.dependsOn` accordingly

---

## Example project structure

```txt
Root/
├── libs/
│   └── project-name/
│       ├── zod2md.config.ts        🔎 triggers the sync generator
│       ├── project.json            👈 checks targets + build.dependsOn
│       ├── tsconfig.lib.json       👈 configures zod2md-jsdocs TS plugin
│       └── src/
│           └── index.ts
└── ...
```

---

## Targeted behavior summary

- ✔ No `zod2md.config.ts` → project is ignored
- ✔ Missing TS plugin config → patched automatically
- ✔ Missing Zod2Md target → added automatically
- ✔ Missing `build.dependsOn` entries → updated automatically
- ✔ Fully configured project → no changes, no errors

---

## Per-project usage (optional)

You can still scope execution to a single project:

```bash
nx g @tooling/zod2md-jsdocs:sync-zod2md-setup project-name
```

---

## Previewing the generator

To preview what the generator would change without applying modifications:

```bash
nx g @tooling/zod2md-jsdocs:sync-zod2md-setup --dry-run
```

This is especially useful when integrating the sync generator into CI or workspace maintenance workflows.

---

## Register a Global Sync Generator

Global sync generators are registered in the _nx.json_ file like this:

_nx.json_

```json
{
  "sync": {
    "globalGenerators": ["./tools/zod2md-jsdocs:sync-zod2md-setup"]
  }
}
```

## Register a Local Sync Generator

Local sync generators are registered in the project's `package.json` or `project.json` file under the `syncGenerators` property for specific targets:

_package.json_

```json
{
  "name": "my-project",
  "nx": {
    "targets": {
      "build": {
        "syncGenerators": ["./tools/zod2md-jsdocs:sync-zod2md-setup"]
      }
    }
  }
}
```

_project.json_

```json
{
  "name": "my-project",
  "targets": {
    "build": {
      "syncGenerators": ["./tools/zod2md-jsdocs:sync-zod2md-setup"]
    }
  }
}
```

With this configuration, the sync generator will run automatically before the specified target (e.g., `build`).

## Notes

- This is a **sync generator**, not a build step
- It is safe to run repeatedly
- All changes are deterministic and idempotent
- Designed to work seamlessly with `nx sync` and automated workflows
