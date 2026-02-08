# JITI ISSUES

## Issue Discovery Workflow

When encountering a module loading error with jiti/tsx, follow this systematic approach to identify the problematic package:

1. **Isolate the issue**

   - Open `code-pushup.config.ts`
   - Comment out all plugin configurations
   - Run: `nx reset && nx code-pushup -- print-config --output out.json`
   - Verify the command succeeds without errors

2. **Identify the problematic plugin**

   - Uncomment plugins one at a time
   - After each plugin, run: `nx code-pushup --print-config --output out.json`
   - Continue until the error reproduces
   - The last plugin uncommented is the one causing the issue

3. **Document the issue**
   - Once the problematic plugin is identified, collect all relevant information
   - Fill out the issue template below with:
     - The library/package name
     - Error message and stack trace
     - Reproduction steps
     - Source code locations
     - Any preliminary fixes or workarounds

- add the issue to the list of issues below

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

## List of Issues

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

### @vitest/eslint-plugin (via ESLint plugin)

**Library** (required)  
[@vitest/eslint-plugin](https://github.com/vitest-dev/vitest/tree/main/packages/eslint-plugin)

**Problem** (required)  
`@vitest/eslint-plugin` fails with Invalid URL error when ESLint configs are loaded through `configureEslintPlugin()`. The issue occurs because tsx intercepts nested imports from files loaded by jiti, transforming `@vitest/eslint-plugin` before jiti can handle it.

**Description** (required)  
The ESLint plugin (`configureEslintPlugin()`) loads ESLint configuration files using `loadConfigByPath()`. When ESLint configs (like `eslint.config.js`) import `@code-pushup/eslint-config/vitest.js`, which in turn imports `@vitest/eslint-plugin`, tsx transforms the CommonJS distribution. This causes `import.meta.url` to become `'about:blank'`, leading to `new URL('index.cjs', 'about:blank')` failing with Invalid URL error.

**Root Cause:**

- The CLI runs with `NODE_OPTIONS="--import tsx"`, registering tsx as a Node.js loader
- When `eslint.config.js` executes with static imports, Node.js uses tsx for module resolution
- tsx transforms `@vitest/eslint-plugin` before jiti can handle it
- jiti's `nativeModules` configuration only prevents jiti from transforming modules, not tsx
- This is an architectural limitation when both jiti and tsx are used together

**Reproduction** (required)
`nx reset && nx code-pushup -- print-config --output out.json` (with `configureEslintPlugin()` enabled in `code-pushup.config.ts`)

Or using the reproduction script:
`TSX_TSCONFIG_PATH=tsconfig.base.json node --import tsx tools/jiti/eslint-vitest/issue-eslint-vitest.ts`

Or using the old reproduction script (now with shorter output):
`TSX_TSCONFIG_PATH=tsconfig.base.json node --import tsx tools/jiti/old-vitest/issue-vitest.ts`

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
[tools/jiti/eslint-vitest/issue-eslint-vitest.ts](tools/jiti/eslint-vitest/issue-eslint-vitest.ts)

**Status** (required)  
Resolved - Fixed by temporarily removing `--import tsx` from `NODE_OPTIONS` when loading ESLint configs, allowing jiti to handle all module loading without tsx interference.

**Source Code** (required)  
[packages/plugin-eslint/src/lib/meta/versions/flat.ts](packages/plugin-eslint/src/lib/meta/versions/flat.ts#L64-L73) - `loadConfigByPath` function that delegates to child process loading

[packages/plugin-eslint/src/lib/meta/versions/flat.ts](packages/plugin-eslint/src/lib/meta/versions/flat.ts#L75-L210) - `loadConfigInChildProcess` function that spawns a child process without tsx

```typescript
async function loadConfigByPath(configPath: string): Promise<FlatConfig> {
  // Temporarily remove --import tsx from NODE_OPTIONS to prevent tsx from intercepting
  // nested imports. This allows jiti to handle all module loading and respect its
  // nativeModules configuration (like @vitest/eslint-plugin).
  const originalNodeOptions = process.env.NODE_OPTIONS;

  // Remove --import tsx if present, preserving other options
  const nodeOptions =
    originalNodeOptions
      ?.split(/\s+/)
      .filter(opt => {
        if (opt.includes('--import')) {
          return !opt.includes('tsx');
        }
        return true;
      })
      .join(' ') || undefined;

  // Temporarily set modified NODE_OPTIONS if it changed
  if (nodeOptions !== originalNodeOptions) {
    if (nodeOptions) {
      process.env.NODE_OPTIONS = nodeOptions;
    } else {
      delete process.env.NODE_OPTIONS;
    }
  }

  try {
    // Load config - jiti will handle imports without tsx interference
    const mod = await importModule<FlatConfig | { default: FlatConfig }>({
      filepath: configPath,
    });
    return 'default' in mod ? mod.default : mod;
  } finally {
    // Always restore original NODE_OPTIONS
    if (originalNodeOptions !== undefined) {
      process.env.NODE_OPTIONS = originalNodeOptions;
    } else {
      delete process.env.NODE_OPTIONS;
    }
  }
}
```

[code-pushup.config.ts](code-pushup.config.ts#L20) - `configureEslintPlugin()` call that triggers ESLint config loading

[eslint.config.js](eslint.config.js#L8) - ESLint config that imports `@code-pushup/eslint-config/vitest.js`

[packages/utils/src/lib/import-module.ts](packages/utils/src/lib/import-module.ts#L19-L23) - `JITI_NATIVE_MODULES` list that includes `@vitest/eslint-plugin` and `@code-pushup/eslint-config`

**Solution** (required)  
The fix loads ESLint configs in a child process without tsx to prevent tsx from intercepting nested imports. This allows jiti to handle all module loading and respect its `nativeModules` configuration.

**How it works:**

1. Create a temporary loader script that uses jiti to load the ESLint config
2. Spawn a child Node.js process with `NODE_OPTIONS` that excludes `--import tsx`
3. The child process loads the config using jiti, which handles all imports without tsx interference
4. Serialize the config (handling circular references) and write it to a temporary file
5. Read the serialized config from the parent process and return it
6. Clean up temporary files

**Why this works:**

- Child processes don't inherit already-registered loaders from the parent process
- By removing `--import tsx` from the child's `NODE_OPTIONS`, tsx is never registered as a loader
- jiti can then handle all module loading and respect its `nativeModules` configuration
- `@vitest/eslint-plugin` is loaded natively without transformation, preserving `import.meta.url`
- The parent process continues to use tsx normally for other operations

**Verification** (required)  
Run the following command to verify the fix:

```bash
nx reset && nx code-pushup -- print-config --output out.json
```

**Expected result:** The original `TypeError: Invalid URL` error with `@vitest/eslint-plugin` should be resolved. The command should no longer fail with the tsx transformation error.

**Note on optional dependencies:** If your ESLint config references optional peer dependencies (like `eslint-plugin-jsx-a11y`) that aren't installed, the child process may fail with a "Cannot find module" error. This is expected behavior and separate from the original JITI/tsx issue. To resolve:

1. Install the missing optional dependency: `npm install eslint-plugin-jsx-a11y`
2. Or remove the reference to the optional plugin from your ESLint config

The reproduction script should also run without the original Invalid URL error:

```bash
TSX_TSCONFIG_PATH=tsconfig.base.json node --import tsx tools/jiti/eslint-vitest/issue-eslint-vitest.ts
```

**Known limitations:**

- The child process approach requires all ESLint config dependencies to be installed. Optional peer dependencies that are referenced in the config must be installed, even if they're marked as optional in package.json.
- This is a limitation of loading ESLint configs programmatically - ESLint itself may handle missing optional dependencies more gracefully during actual linting, but config parsing requires all referenced modules to be available.
- When a missing optional dependency is encountered, the error message now provides clear guidance on which package needs to be installed and how to install it.

**Error handling:**
The implementation includes improved error messages for missing ESLint dependencies. When a module like `eslint-plugin-jsx-a11y` is missing, the error will clearly indicate:

- Which dependency is missing
- That it's referenced in the ESLint config but not installed
- How to fix it (e.g., `npm install eslint-plugin-jsx-a11y`)

This makes it easier to diagnose and resolve missing optional dependency issues.
