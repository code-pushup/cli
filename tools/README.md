## Vitest config factory and setup presets

This folder contains utilities to centralize and standardize Vitest configuration across the monorepo.

### Files

- `vitest-config-factory.ts`: builds typed Vitest configs with sensible defaults.
- `vitest-setup-presets.ts`: reusable groups of `setupFiles` paths by test kind.

### Goals

- Reduce duplication across `vitest.*.config.ts` files.
- Keep per-package intent clear with minimal overrides.
- Provide safe defaults and easy extension points.

### Quick start

Use the factory in your suite configs (project root is required):

```ts
/// <reference types="vitest" />
import { createE2eConfig, createIntConfig, createUnitConfig } from '../../tools/vitest-config-factory.js';

export default createUnitConfig('core', {
  projectRoot: new URL('../../', import.meta.url),
});
```

Creators:

- `createUnitConfig(projectKey, { projectRoot, ...options })`
- `createIntConfig(projectKey, { projectRoot, ...options })`
- `createE2eConfig(projectKey, { projectRoot, ...options })`

`projectKey` is used for cache and coverage directories.

### Defaults

Common to all kinds:

- `reporters: ['basic']`, `globals: true`, `environment: 'node'`
- `alias: tsconfigPathAliases()`
- `pool: 'threads'` with `singleThread: true`
- Cache directories resolved from `projectRoot` (absolute paths)

Coverage:

- Unit/Int: enabled by default, reports to `<projectRoot>/packages/<project>/.coverage`
- E2E: disabled by default, reports to `<projectRoot>/e2e/<project>/.coverage` if enabled
- Default exclude: `['mocks/**', '**/types.ts']`

Global setup:

- Unit/Int: `['<projectRoot>/global-setup.ts']` by default
- E2E: none by default (set per-suite if needed)

Include patterns:

- Unit: `src/**/*.unit.test.*`
- Int: `src/**/*.int.test.*`
- E2E: `tests/**/*.e2e.test.*`

### setupFiles strategy

Baseline `setupFiles` are injected automatically by kind:

- Unit baseline: `console.mock.ts`, `reset.mocks.ts`
- Int baseline: `console.mock.ts`, `reset.mocks.ts`
- E2E baseline: `reset.mocks.ts`

Extend with additional files using `options.setupFiles` — they append after the baseline (paths are project-root-relative):

```ts
export default createUnitConfig('core', {
  projectRoot: new URL('../../', import.meta.url),
  setupFiles: ['testing/test-setup/src/lib/cliui.mock.ts'],
});
```

Replace entirely using `overrideSetupFiles: true` (paths are project-root-relative):

```ts
export default createUnitConfig('core', {
  projectRoot: new URL('../../', import.meta.url),
  overrideSetupFiles: true,
  setupFiles: ['testing/test-setup/src/lib/cliui.mock.ts', 'testing/test-setup/src/lib/fs.mock.ts'],
});
```

### Using presets directly

`vitest-setup-presets.ts` exposes grouped arrays you can compose if needed:

```ts
import { setupPresets } from '../../tools/vitest-setup-presets.js';

export default createIntConfig('core', {
  projectRoot: new URL('../../', import.meta.url),
  setupFiles: [...setupPresets.int.portalClient],
});
```

Preset keys:

- `setupPresets.unit.{base,cliui,fs,git,portalClient,matchersCore,matcherPath}`
- `setupPresets.int.{base,cliui,fs,git,portalClient,matcherPath,chromePath}`
- `setupPresets.e2e.{base}`

### Options reference

`CreateVitestConfigOptions` (required + optional):

- `projectKey` (string): coverage/cache naming.
- `kind` ('unit' | 'int' | 'e2e'): test kind.
- `projectRoot` (string | URL): absolute root for all paths.
- `include?: string[]`: override default include globs.
- `setupFiles?: string[]`: extra setup files (appended to baseline; project-root-relative).
- `overrideSetupFiles?: boolean`: skip baseline and use only provided list.
- `globalSetup?: string[]`: override default global setup (project-root-relative).
- `coverage?: { enabled?, exclude? }`
- `testTimeout?: number`: e.g., for E2E.
- `typecheckInclude?: string[]`: include patterns for Vitest typecheck.
- `cacheKey?: string`: custom cache dir suffix.

### Path and URL resolution

- The factory requires `projectRoot` (string path or `URL`).
- Internally, it converts `projectRoot` into a `URL` and resolves all paths with `new URL(relativePath, projectRoot).pathname` to produce absolute filesystem paths.
- Affected fields:
  - `cacheDir`, `test.cache.dir`
  - `coverage.reportsDirectory`
  - default `globalSetup`
  - baseline `setupFiles` from presets and any extras you pass
- Expected inputs:
  - `setupFiles` and `globalSetup` you pass should be project-root-relative strings.
  - No `../../` paths are needed in configs; moving the factory won’t break resolution.

### Merging behavior (arrays and overrides)

- `setupFiles`:
  - Baseline files (by kind) are injected automatically.
  - Extras in `options.setupFiles` are appended after the baseline.
  - Set `overrideSetupFiles: true` to replace the list entirely.
- `coverage.exclude`:
  - Defaults to `['mocks/**', '**/types.ts']`.
  - If you provide excludes, they are appended to the defaults.
- `include`, `globalSetup`, `testTimeout`, `typecheck.include`:
  - If provided, they override the defaults for that suite.

### Notes

- Imports use `.js` extensions to work under ESM.
- No de-duplication of `setupFiles`. Avoid adding duplicates.
- You can opt-in to coverage for E2E by passing `coverage.enabled: true`.
