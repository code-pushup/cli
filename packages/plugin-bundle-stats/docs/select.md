### Selection

To select files for an audit, glob patterns are used to include and exclude parts of the output files.
All options are provided as glob patterns matching either `path`, `path` in `inputs` or `entryPoint`.

**Types**

```ts
export interface SelectionOptions {
  mode: 'bundle' | 'onlyMatching' | 'withAllDeps' | 'withStartupDeps';

  // targeting output path of a `OutputNode`
  includeOutputs: string[];
  excludeOutputs: string[];

  // targeting input paths of a `OutputNode`
  includeInputs: string[];
  excludeInputs: string[];
}
```

**Example Configuration**

```ts
const selection: SelectionOptions = {
  mode: 'bundle',
  includeOutputs: ['**/features/*'],
  excludeOutputs: ['**/features/legacy/**'],
  excludeInputs: ['**/ui/**'],
};
```

#### Selection Behaviour

- **🎯Glob syntax**: Supports standard glob patterns like `*`, `**`, `?`, `[abc]`.
- **Include → Exclude**: Selection starts with `include*` patterns (for outputs and inputs), followed by `exclude*` to remove matches.
- **Precedence**: If a file matches both `include` and `exclude`, it will be excluded.
- **🔗 Dependency handling** is controlled by `mode`:
  - `'bundle'` and `'onlyMatching'` ignore imports.
  - `'withAllDependencies'` and `'withStartupDependencies'`: preserve imports even if excluded

---

> All examples target this stats data.
>
> **Example Stats**
>
> The following is a minimal stats representation used to explain different features of the selection process.
>
> ```
> stats.json
> └── outputs
>   ├── dist/index.js 309kB                             // entryPoint: src/index.ts
>    │   ├── inputs
>    │   │   └── src/index.ts
>    │   │       ├── src/lib/feature-1.ts  100kB         // import-statement
>    │   │       │   └── src/lib/utils/format.ts  100kB  // import-statement
>    │   │       ├── src/lib/utils/math.ts  100kB        // import-statement
>    │   │       └── src/lib/feature-2.ts  100kB         // dynamic-import
>    │   └── imports
>    │       ├── dist/chunks/chunk-U6O5K65G.js           // import-statement
>    │       └── dist/chunks/feature-2-X2YVDBQK.js       // dynamic-import
>    ├── dist/bin.js 309kB                               // entryPoint: src/bin.ts
>    │   ├── inputs
>    │   │   ├── src/lib/feature-1.ts  100kB             // import-statement
>    │   │   │   └── src/lib/utils/format.ts  100kB      // import-statement
>    │   │   └── src/lib/utils/math.ts  100kB            // import-statement
>    │   └── imports
>    │       └── dist/chunks/chunk-U6O5K65G.js           // import-statement
>    ├── dist/chunks/chunk-U6O5K65G.js 309kB
>    │   └── inputs
>    │       ├── src/lib/utils/format.ts 100kB
>    │       ├── src/lib/feature-1.ts 100kB
>    │       └── src/lib/utils/math.ts 100kB
>    └── dist/chunks/feature-2-X2YVDBQK.js  109kB        // entryPoint: src/lib/feature-2.ts
>        └── inputs
>            └── src/lib/feature-2.ts 100kB
> ```

````

---

##### Include Output

Select only `dist/index.js` and its dependencies.

**Selection Options**

```ts
{
  includeOutputs: ['**/dist/index.js']
}
````

**Selection Result:**

```
stats.json
└── outputs
    ├── 🎯 dist/index.js                                    // entryPoint: src/index.ts
    │   ├── inputs
    │   └── imports
    │       └── dist/chunks/chunk-U6O5K65G.js               // import-statement
    └── 🔗 dist/chunks/chunk-U6O5K65G.js                    // imported by `dist/index.js`
        └── inputs
```

The target output and its imported dependencies are included.

##### Include/Exclude Output

Select all outputs except bin files.

**Selection Options**

```ts
{
  includeOutputs: ["**/*"],
  excludeOutputs: ["**/bin.js"]
}
```

**Selection Result:**

```
stats.json
└── outputs
    ├── 🎯 dist/index.js                                    // entryPoint: src/index.ts
    ├── 🔗 dist/chunks/chunk-U6O5K65G.js                    // imported by `dist/index.js`
    ├── 🔗 dist/chunks/feature-2-X2YVDBQK.js               // imported by `dist/index.js`
    └── // excluded: dist/bin.js
```

All outputs are included except those matching the exclude pattern.

##### Include Input

Select outputs that contain specific input files.

**Selection Options**

```ts
{
  includeInputs: ['**/feature-2.ts'];
}
```

**Selection Result:**

```
stats.json
└── outputs
    ├── dist/index.js                                    // entryPoint: src/index.ts
    │   └── inputs
    │       └── src/index.ts
    │           └── 🎯 src/lib/feature-2.ts               // dynamic-import
    └── 🔗 dist/chunks/feature-2-X2YVDBQK.js             // contains feature-2.ts
        └── inputs
            └── 🎯 src/lib/feature-2.ts
```

Only outputs containing the specified input files are included.

##### Include/Exclude Input

Select all outputs but exclude those containing feature-2 files.

**Selection Options**

```ts
{
  includeOutputs: ["**/*"],
  excludeInputs: ["**/feature-2.ts"]
}
```

**Selection Result:**

```
stats.json
└── outputs
    ├── 🎯 dist/bin.js                                      // entryPoint: src/bin.ts
    ├── 🔗 dist/chunks/chunk-U6O5K65G.js                    // imported by `dist/bin.js`
    ├── // excluded: dist/index.js (contains feature-2.ts)
    └── // excluded: dist/chunks/feature-2-X2YVDBQK.js (contains feature-2.ts)
```

Outputs containing the excluded input files are filtered out.

##### Include/Exclude Mixed

Select feature outputs but exclude utility files.

**Selection Options**

```ts
{
  includeOutputs: ['**/features/*', '**/index.js'],
  excludeOutputs: ['**/bin.js'],
  excludeInputs: ['**/utils/**']
}
```

**Selection Result:**

```
stats.json
└── outputs
    ├── 🎯 dist/index.js                                    // matches includeOutputs
    │   └── inputs
    │       └── src/index.ts
    │           ├── src/lib/feature-1.ts  100kB
    │           └── src/lib/feature-2.ts  100kB
    └── 🔗 dist/chunks/feature-2-X2YVDBQK.js               // imported by `dist/index.js`
        └── inputs
            └── src/lib/feature-2.ts 100kB
```

Complex filtering combines output and input patterns for precise selection.

---

##### Mode: `onlyMatching`

Select only input files that match a pattern — exclude outputs, imports, and bundler overhead.

**Selection Options**

```ts
{
  mode: 'onlyMatching',
  includeInputs: ['**/lib/utils/format.ts']
}
```

**Selection Result:**

```
stats.json
└── outputs
    ├── dist/chunks/chunk-U6O5K65G.js  100kB              // excludes overhead
        └── inputs
            └── 🎯 src/lib/utils/format.ts 100kB          // matches `includeInputs`
```

Only the bytes from matching input files are counted, excluding bundler overhead.

##### Mode: `bundle`

Include the full output bundle with overhead and its bundled inputs but not external chunks.

**Selection Options**

```ts
{
  mode: 'bundle',
  includeOutputs: ['**/dist/index.js']
}
```

**Selection Result:**

```
stats.json
└── outputs
    └── 🎯 dist/index.js 209kB                            // matches `includeOutputs`
        └── inputs
            ├── src/lib/utils/format.ts 100kB
            └── src/lib/utils/math.ts 100kB
```

Only what's bundled directly in the output file is included.

##### Mode: `withStartupDeps`

Include the output and all static imports required at startup.

**Selection Options**

```ts
{
  mode: 'withStartupDeps',
  includeOutputs: ['**/dist/index.js']
}
```

**Selection Result:**

```
stats.json
└── outputs
    ├── 🎯 dist/index.js 209kB
    │   └── inputs
    │       ├── src/lib/utils/format.ts 100kB
    │       └── src/lib/utils/math.ts 100kB
    └── 🔗 dist/chunks/chunk-U6O5K65G.js 109kB           // statically imported by `dist/index.js`
        └── inputs
            └── src/lib/utils/log.ts 100kB
```

Static imports are preserved even if they would be excluded by patterns.

##### Mode: `withAllDeps`

Include the output and all imported files — both static and dynamic.

**Selection Options**

```ts
{
  mode: 'withAllDeps',
  includeOutputs: ['**/dist/index.js']
}
```

**Selection Result:**

```
stats.json
└── outputs
    ├── 🎯 dist/index.js 209kB
    │   └── inputs
    │       ├── src/lib/utils/format.ts 100kB
    │       └── src/lib/utils/math.ts 100kB
    ├── 🔗 dist/chunks/chunk-U6O5K65G.js 109kB           // static import
    │   └── inputs
    │       └── src/lib/utils/log.ts 100kB
    └── 🔗 dist/chunks/feature-2-X2YVDBQK.js 109kB       // dynamic import
        └── inputs
            └── src/lib/feature-2.ts 100kB
```

Both static and dynamic dependencies are included in their entirety.
