# Zod2Md Nx Plugin

**Package:** `@tooling/zod2md-jsdocs`  
**Plugin name:** `zod2md-jsdocs-nx-plugin`

This Nx plugin automatically wires **Zod → Markdown documentation generation**
into your workspace by detecting `zod2md.config.js` files and configuring
projects accordingly.

---

## What this plugin does

Whenever a `zod2md.config.js` file is found, it:

- Registers a **documentation generation target**
- Ensures documentation is generated **before build**
- Adds a TypeScript patching target
- Registers a **sync generator** to keep the setup consistent

All of this happens automatically — no manual `project.json` editing required.

---

## How it works

The plugin scans your workspace for:

```txt
**/zod2md.config.ts
```

For every match, it infers a project and adds the following targets.

---

## Generated targets

### `generate-docs`

Generates Markdown documentation from Zod schemas.

- Runs `zod2md`
- Formats output with `prettier`
- Fully cacheable
- Produces deterministic outputs

```ts
generate-docs: {
  executor: 'nx:run-commands',
  options: {
    commands: [
      'zod2md --config {projectRoot}/zod2md.config.ts --output {projectRoot}/docs/{projectName}-reference.md',
      'prettier --write {projectRoot}/docs/{projectName}-reference.md'
    ],
    parallel: false
  },
  cache: true,
  inputs: ['production', '^production', '{projectRoot}/zod2md.config.ts'],
  outputs: ['{projectRoot}/docs/{projectName}-reference.md']
}
```

---

### `patch-ts`

Ensures the TypeScript compiler is patched correctly.

- Runs `ts-patch install`
- Cached
- Uses a runtime check to avoid unnecessary work

```ts
patch-ts: {
  command: 'ts-patch install',
  cache: true,
  inputs: [
    'sharedGlobals',
    { runtime: 'ts-patch check' }
  ]
}
```

---

### `build` integration

The plugin automatically updates the `build` target so that:

- Documentation is generated before building
- The sync generator is registered

```ts
build: {
  dependsOn: [
    { target: 'generate-docs', projects: 'self' }
  ],
  syncGenerators: [
    './tools/zod2md-jsdocs/dist:sync-zod2md-setup'
  ]
}
```

---

## Sync generator integration

Each inferred project is automatically wired to use the
**`sync-zod2md-setup`** sync generator.

This ensures:

- TypeScript plugin configuration stays correct
- Required targets remain present
- `build.dependsOn` stays consistent
- The setup is safe to re-run and self-healing

---

## Example project layout

```txt
libs/my-lib/
├── zod2md.config.ts          👈 detected by the plugin
├── project.json              👈 targets injected automatically
├── tsconfig.lib.json         👈 patched by the sync generator
├── docs/
│   └── my-lib-reference.md   👈 generated output
└── src/
    └── index.ts
```

---

Simply add a `zod2md.config.ts` file — the plugin handles the rest.
