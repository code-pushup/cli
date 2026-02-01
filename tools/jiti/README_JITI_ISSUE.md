# JITI ISSUES

## Issue Template

**Library** (required)  
[Package Name](https://github-or-npm-etc.com)

**Problem** (required)  
1 short sentence describing the problem

**Description** (required)  
Detailed explanation of where we use the package and why

**Reproduction** (required)  
Always something executable. First try `node -e "..."`. If that fails, try to work around it with helper files.

**Error** (required)  
The original full error message (paths starting from repo root for brevity)

**Issues** (optional)  
Links to a file, a snippet or a PR with the reproduction or the error.
Local files are preferred.
Location of the file: `tools/jiti/<library-name>/issue-<library-name>.ts`

**Source Code** (required)  
Links to a file and line od CodePushup source code that is affected by the issue. optinal a snipet here.

**Preliminary fix** (optional)  
Links to a file, a snippet or a PR with the fix
Local files are preferred.
Location of the file: `tools/jiti/<library-name>/fix-<library-name>.ts`

## Issues

### axe-core

**Library** (required)  
[axe-core](https://github.com/dequelabs/axe-core)

**Problem** (required)  
Access of `window.document` through 'axe-core' import

**Description** (required)  
axe-core is used in the accessibility plugin for automated accessibility testing. The package expects a browser environment with a global `window` object, but when loaded through JITI in a Node.js context, `window` is undefined, causing the import, and its side effect, to fail.

**Reproduction** (required)  
`node --input-type=module -e "import('jiti').then(j=>j.default()( 'axe-core'))"`

**Error** (required)

```bash
/node_modules/axe-core/axe.js:14
  var document = window.document;
                        ^
TypeError: Cannot read properties of undefined (reading 'document')
    at axeFunction (/cli/node_modules/axe-core/axe.js:14:25)
    at /cli/node_modules/axe-core/axe.js:32979:3
    at eval_evalModule (/cli/node_modules/jiti/dist/jiti.cjs:1:196325)
    at jitiRequire (/cli/node_modules/jiti/dist/jiti.cjs:1:190233)
    at /cli/node_modules/jiti/dist/jiti.cjs:1:199352
    at file:///cli/[eval1]:1:35

Node.js v24.1.0
```

**Issues** (optional)  
https://github.com/dequelabs/axe-core/issues/3962

**Source Code** (required)  
[packages/plugin-axe/src/lib/axe-core-polyfilled.ts](packages/plugin-axe/src/lib/axe-core-polyfilled.ts#L20) - Import of `axe-core` that fails when loaded through jiti without polyfill

```typescript
import axe from 'axe-core';
```

[packages/utils/src/lib/import-module.ts](packages/utils/src/lib/import-module.ts#L59) - jiti import mechanism that loads modules

**Preliminary fix** (optional)  
https://github.com/code-pushup/cli/pull/1228/commits/b7109fb6c78803adae7f11605446ef2b6de950ff

### vitest

**Library** (required)  
[@vitest/eslint-plugin](https://github.com/vitest-dev/vitest/tree/main/packages/eslint-plugin)

**Problem** (required)  
`@vitest/eslint-plugin` cannot be executed with tsx and jiti internally

**Description** (required)  
The Vitest ESLint plugin is used for linting Vitest test files in our codebase. When running ESLint with tsx module loading (as used in `nx code-pushup`), the plugin fails due to URL parsing issues in its CommonJS distribution. When tsx transforms `@vitest/eslint-plugin`, `import.meta.url` becomes `'about:blank'`, causing `new URL('index.cjs', 'about:blank')` to fail with Invalid URL error.

**Reproduction** (required)  
`TSX_TSCONFIG_PATH=tsconfig.base.json node --import tsx tools/jiti/vitest/issue-vitest.ts`

**Error** (required)

```bash
TypeError: Invalid URL
    at new URL (node:internal/url:819:25)
    at Object.<anonymous> (/node_modules/@vitest/eslint-plugin/dist/index.cjs:1:93551)
    at Module._compile (node:internal/modules/cjs/loader:1734:14)
    at Object.transformer (/node_modules/tsx/dist/register-C1urN2EO.cjs:2:1122)
    at Module.load (node:internal/modules/cjs/loader:1469:32)
    at Module._load (node:internal/modules/cjs/loader:1286:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Module.require (node:internal/modules/cjs/loader:1491:12)
    at require (node:internal/modules/helpers:135:16) {
  code: 'ERR_INVALID_URL',
  input: 'index.cjs',
  base: 'about:blank'
}
```

**Issues** (optional)  
[tools/jiti/vitest/issue-vitest.ts](tools/jiti/vitest/issue-vitest.ts)

**Source Code** (required)  
[packages/utils/src/lib/import-module.ts](packages/utils/src/lib/import-module.ts#L19-L23) - `JITI_NATIVE_MODULES` list that includes `@vitest/eslint-plugin`

```typescript
export const JITI_NATIVE_MODULES = ['@vitest/eslint-plugin', '@code-pushup/eslint-config', 'lighthouse'] as const;
```

[packages/plugin-eslint/src/lib/meta/versions/flat.ts](packages/plugin-eslint/src/lib/meta/versions/flat.ts#L62-L69) - `loadConfigByPath` function that loads ESLint config files

```typescript
async function loadConfigByPath(configPath: string): Promise<FlatConfig> {
  const absolutePath = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath);
  // Use jiti's importModule instead of dynamic import to ensure nativeModules
  // (like @vitest/eslint-plugin) are loaded without transformation.
  const mod = await importModule<FlatConfig | { default: FlatConfig }>({
    filepath: absolutePath,
  });
  return 'default' in mod ? mod.default : mod;
}
```

**Preliminary fix** (optional)  
[tools/jiti/vitest/fix-vitest.ts](tools/jiti/vitest/fix-vitest.ts) - Fix implementation using jiti's `importModule` instead of dynamic `import()` to ensure `@vitest/eslint-plugin` is loaded natively without transformation.

[packages/plugin-eslint/src/lib/meta/versions/flat.ts](packages/plugin-eslint/src/lib/meta/versions/flat.ts#L62-L69) - Updated `loadConfigByPath` to use `importModule` instead of dynamic import.
