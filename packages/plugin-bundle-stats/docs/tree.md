### Dependency Tree

The dependency tree provides users with a quick understanding of the dependencies graph of selected artifacts. It serves as a replacement for opening bundle stats in the browser to search for respective files.

**Types**

```ts
export type ViewMode = 'all' | 'onlyMatching';

export type GeneralViewConfig = {
  enabled: boolean;
  mode: ViewMode;
};

export type DependencyTreeConfig = GeneralViewConfig & {
  groups: GroupingRule[] | false;
  pruning: PruningConfig;
};

export interface GroupingRule {
  includeInputs: string | string[];
  excludeInputs?: string | string[];
  title?: string;
  icon?: string;
  numSegments?: number;
}

export interface PruningConfig {
  maxChildren?: number;
  maxDepth?: number;
  startDepth?: number;
  minSize?: number;
  pathLength?: number | false;
}
```

**Example Configuration**

```ts
const treeConfig: DependencyTreeConfig = {
  mode: 'all',
  groups: [
    {
      title: 'Angular Router',
      include: ['node_modules/@angular/router/**'],
      exclude: ['**/*.spec.ts'],
      icon: '🅰️',
      numSegments: 3,
    },
  ],
  pruning: {
    maxChildren: 3,
    maxDepth: 2,
    startDepth: 1,
    minSize: 10_000,
    pathLength: 50,
  },
};
```

---

> All examples target this stats data structure.
>
> **Example Stats**
>
> ```
> stats.json
> └── outputs
>     └── dist/index.js 400kB
>         ├── inputs
>         │   ├── src/index.ts 50kB
>         │   ├── src/lib/feature-1.ts 100kB
>         │   └── src/lib/utils/format.ts 75kB
>         └── imports
>             └── dist/chunks/vendor.js
> ```

---

#### Mode: `all`

Shows complete dependency tree including all outputs, inputs, and imports with full bundler overhead.

**Tree Configuration**

```ts
{
  mode: 'all';
}
```

**Tree Result:**

```txt
example-group
├── dist/index.js
│   ├── src/index.ts
│   ├── src/lib/feature-1.ts
│   └── src/lib/utils/format.ts
├── dist/chunks/vendor.js
│   └── node_modules/@angular/router/index.ts
└── dist/styles.css
```

#### Mode: `onlyMatching`

Shows only the bytes that match selection patterns, excluding bundler overhead.

**Tree Configuration**

```ts
{
  mode: 'onlyMatching';
}
```

**Tree Result:**

```txt
example-group
├── dist/index.js
│   ├── src/index.ts
│   ├── src/lib/feature-1.ts
│   └── src/lib/utils/format.ts
├── dist/chunks/vendor.js
│   └── node_modules/@angular/router/index.ts
└── dist/styles.css
```

---

#### Grouping - Disabled

**Tree Result:**

```txt
example-group
└── entry-2.js
    ├── node_modules/@angular/router/provider.ts
    ├── node_modules/@angular/router/service.ts
    │   └── node_modules/@angular/router/utils.ts
    └── node_modules/lodash/chunk.js
```

#### Grouping - Basic

**Grouping Configuration**

```ts
{
  groups: [
    {
      title: 'Angular Router',
      include: ['node_modules/@angular/router/**'],
      exclude: ['**/*.spec.ts'],
      icon: '🅰️',
    },
  ];
}
```

**Tree Result:**

```txt
example-group
└── entry-2.js
    ├── 🅰️ Angular Router
    │   ├── node_modules/@angular/router/provider.ts
    │   ├── node_modules/@angular/router/service.ts
    │   └── node_modules/@angular/router/utils.ts
    └── node_modules/lodash/chunk.js
```

#### Grouping - Include/Exclude

GroupingRule supports flexible pattern matching with include/exclude logic:

- **`include`**: Patterns to match files for inclusion in the group
- **`exclude`**: Patterns to exclude from the group (optional)
- **Pattern precedence**: Files matching both include and exclude will be excluded

**Advanced Grouping Configuration**

```ts
{
  groups: [
    {
      title: 'React Components',
      include: ['**/components/**/*.tsx', '**/components/**/*.jsx'],
      exclude: ['**/*.test.*', '**/*.spec.*'],
      icon: '⚛️',
    },
    {
      title: 'Node Modules',
      include: ['node_modules/**'],
      exclude: ['node_modules/**/*.d.ts'],
      icon: '📦',
    },
  ];
}
```

#### Grouping - NumSegments

The `numSegments` property controls how files are grouped by their path structure.

**Without numSegments:**

```txt
example-group
└── entry.js
    ├── src/components/ui/Button.tsx
    ├── src/components/ui/Modal.tsx
    ├── src/components/forms/Input.tsx
    └── src/components/forms/Select.tsx
```

**Grouping Configuration**

```ts
{
  groups: [
    {
      title: 'Components',
      include: ['**/components/**'],
      numSegments: 2,
    },
  ];
}
```

**With numSegments:**

```txt
example-group
└── entry.js
    └── Components
        ├── ui
        │   ├── Button.tsx
        │   └── Modal.tsx
        └── forms
            ├── Input.tsx
            └── Select.tsx
```

---

#### Pruning - MaxChildren

**Unpruned:**

```txt
example-group
├── index.js
│   ├── src/app.ts
│   ├── src/components/Header.ts
│   ├── src/components/Footer.ts
│   ├── src/utils/math.ts
│   └── src/main.css
├── vendor.js
│   ├── node_modules/react.ts
│   ├── node_modules/react-dom.ts
│   └── node_modules/lodash.js
└── logo.svg
```

**Pruning Configuration**

```ts
{
  pruning: {
    maxChildren: 3,
    maxDepth: 2
  }
}
```

**Pruned Result:**

```txt
example-group
├── index.js
│   ├── src/app.ts
│   ├── src/components/Header.ts
│   └── … 3 more inputs
├── vendor.js
│   ├── node_modules/react.ts
│   └── … 2 more inputs
└── logo.svg
```

#### Pruning - MinSize

**With small files:**

```txt
example-group                               840 kB   10 files
└── index.js                                840 kB   9 files
    ├── src/app.js                         400 kB
    ├── src/large-1.js                     200 kB
    ├── src/medium-1.js                    100 kB
    ├── src/small-1.js                      30 kB
    ├── src/small-2.js                      25 kB
    ├── src/small-3.js                      20 kB
    └── … 4 more files                         65 kB
```

**Pruning Configuration**

```ts
{
  pruning: {
    minSize: 50_000;
  }
}
```

**Pruned Result:**

```txt
example-group                               840 kB   10 files
└── index.js                                840 kB   9 files
    ├── src/app.js                         400 kB
    ├── src/large-1.js                     200 kB
    ├── src/medium-1.js                    100 kB
    └── … 6 more files                        140 kB
```

---

#### Pruning - StartDepth

Controls the depth at which the tree analysis begins, useful for skipping top-level wrapper nodes.

**Without startDepth:**

```txt
example-group
└── main-bundle
    └── app-core
        ├── src/components/Button.tsx
        ├── src/components/Modal.tsx
        └── src/utils/helpers.ts
```

**Pruning Configuration**

```ts
{
  pruning: {
    startDepth: 2;
  }
}
```

**With startDepth:**

```txt
example-group
├── src/components/Button.tsx
├── src/components/Modal.tsx
└── src/utils/helpers.ts
```

#### Pruning - PathLength

Controls how long file paths can be before truncation, or disables truncation entirely.

**Full path:**

```txt
example-group
└── src/lib/utils/helper/format/left-pad.js
```

**Pruning Configuration**

```ts
{
  pruning: {
    pathLength: 30;
  }
}
```

**Shortened path:**

```txt
example-group
└── src/.../left-pad.js
```

**Disable truncation:**

```ts
{
  pruning: {
    pathLength: false;
  }
}
```

---

#### Formatting - Size

**Raw bytes:**

```txt
example-group                 537170
└── main.js                   300000
```

**Formatted:**

```txt
example-group                 537.17 kB
└── main.js                   300 kB
```

#### Formatting - Pluralization

**Unpluralized:**

```txt
example-group                     3
├── main.js                       1
└── utils.js                      2
```

**Pluralized:**

```txt
example-group                     3 modules
├── main.js                       1 module
└── utils.js                      2 modules
```

#### Formatting - RedundantInfo

**With redundancy:**

```txt
example-group                        300 kB    3 modules
└── index.js                         100 kB    1 module
    ├── src/app.js                   100 kB    1 module
    └── … 2 more inputs                 200 kB    2 modules
```

**Cleaned up:**

```txt
example-group                        300 kB    3 modules
└── index.js                         100 kB
    ├── src/app.js
    └── … 2 more inputs                 200 kB
```
