### Insights Table

The grouping table provides a summary view of bundle statistics organized by user-defined groups. It aggregates file sizes and counts for quick analysis of different parts of your bundle.

**Types**

```ts
export type PatternList = readonly string[];

export type SharedViewConfig = {
  enabled?: boolean;
  mode?: 'onlyMatching' | 'all';
};

export interface TablePruningConfig {
  enabled?: boolean;
  maxChildren?: number;
  minSize?: number;
}

export type InsightsTableConfig = SharedViewConfig & {
  groups: GroupingRule[];
  pruning?: TablePruningConfig;
};

export interface GroupingRule {
  includeInputs: string | PatternList;
  excludeInputs?: string | PatternList;
  title?: string;
  icon?: string;
  numSegments?: number;
}
```

**Example Configuration**

```ts
const tableConfig: InsightsTableConfig = {
  mode: 'all',
  groups: [
    {
      title: 'Features',
      includeInputs: ['**/feature-*.ts'],
      excludeInputs: ['**/*.spec.ts'],
      icon: '🎯',
    },
    {
      title: 'Utils',
      includeInputs: ['**/utils/**'],
      icon: '🔧',
    },
  ],
  pruning: {
    enabled: true,
    maxChildren: 10,
    minSize: 1000,
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
>     ├── dist/app.js 300kB
>     │   ├── inputs
>     │   │   ├── src/index.ts 50kB
>     │   │   ├── src/feature-1.ts 100kB
>     │   │   ├── src/feature-2.ts 75kB
>     │   │   └── src/utils/format.ts 25kB
>     │   └── imports
>     │       └── dist/chunks/vendor.js
>     └── dist/chunks/vendor.js 200kB
>         └── inputs
>             └── node_modules/lodash/index.js 150kB
> ```

---

#### Mode: `all`

Shows complete bundle statistics including outputs, inputs, imports and bundler overhead.

**Table Configuration**

```ts
{
  mode: 'all',
  groups: [
    {
      title: 'Features',
      includeInputs: ['**/feature-*.ts']
    }
  ]
}
```

**Table Result:**

| Group       | Modules | Size   |
| ----------- | ------- | ------ |
| 🎯 Features | 2       | 175 kB |
| Rest        | -       | 325 kB |

#### Mode: `onlyMatching`

Shows only the bytes that match selection patterns, excluding bundler overhead.

**Table Configuration**

```ts
{
  mode: 'onlyMatching',
  groups: [
    {
      title: 'Features',
      includeInputs: ['**/feature-*.ts']
    }
  ]
}
```

**Table Result:**

| Group       | Modules | Size   |
| ----------- | ------- | ------ |
| 🎯 Features | 2       | 175 kB |

---

#### Grouping - Include

Select files using single or multiple glob patterns.

**Group Configuration**

```ts
{
  groups: [
    {
      title: 'Source Code',
      includeInputs: ['**/src/**/*.ts', '**/src/**/*.tsx'],
    },
  ];
}
```

**Table Result:**

| Group       | Modules | Size   |
| ----------- | ------- | ------ |
| Source Code | 4       | 250 kB |
| Rest        | -       | 250 kB |

#### Grouping - Include/Exclude

Combine include and exclude patterns for precise file selection.

**Group Configuration**

```ts
{
  groups: [
    {
      title: 'Application Code',
      includeInputs: '**/src/**',
      excludeInputs: ['**/utils/**', '**/*.spec.ts'],
    },
  ];
}
```

**File Matching:**

```txt
stats.json
└── outputs
    └── dist/app.js
        ├── 🎯 src/index.ts          // included by **/src/**
        ├── 🎯 src/feature-1.ts      // included by **/src/**
        ├── 🎯 src/feature-2.ts      // included by **/src/**
        └── ❌ src/utils/format.ts   // excluded by **/utils/**
```

**Table Result:**

| Group            | Modules | Size   |
| ---------------- | ------- | ------ |
| Application Code | 3       | 225 kB |
| Rest             | -       | 275 kB |

#### Grouping - Icons and Titles

Customize group display with icons and titles, or let titles be auto-generated from patterns.

**Manual Titles with Icons:**

```ts
{
  groups: [
    {
      title: 'Core Features',
      includeInputs: '**/features/**/*.ts',
      icon: '🎯',
    },
    {
      title: 'Shared Utils',
      includeInputs: '**/shared/**',
      icon: '🔧',
    },
    {
      title: 'Third Party',
      includeInputs: 'node_modules/**',
      icon: '📦',
    },
  ];
}
```

**Table Result:**

| Group            | Modules | Size   |
| ---------------- | ------- | ------ |
| 🎯 Core Features | 8       | 450 kB |
| 🔧 Shared Utils  | 12      | 125 kB |
| 📦 Third Party   | 45      | 2.1 MB |
| Rest             | -       | 75 kB  |

**Auto-Generated Titles:**

```ts
{
  groups: [
    {
      includeInputs: '**/components/feature-*.tsx',
    },
    {
      includeInputs: ['**/utils/**', '**/helpers/**'],
    },
  ];
}
```

**Table Result:**

| Group                 | Modules | Size   |
| --------------------- | ------- | ------ |
| components/feature-\* | 5       | 175 kB |
| utils/**, helpers/**  | 8       | 125 kB |
| Rest                  | -       | 200 kB |

#### Grouping - NumSegments

Control how paths are grouped using the `numSegments` property for hierarchical organization.

**Without numSegments:**

```txt
└── src/components/ui/Button.tsx
├── src/components/ui/Modal.tsx
├── src/components/forms/Input.tsx
└── src/components/forms/Select.tsx
```

**Group Configuration**

```ts
{
  groups: [
    {
      title: 'Components',
      includeInputs: '**/components/**',
      numSegments: 2,
    },
  ];
}
```

**With numSegments (creates subgroups):**

```txt
└── Components
    ├── ui (Button.tsx, Modal.tsx)
    └── forms (Input.tsx, Select.tsx)
```

---

#### Rest Group - Unmatched Files

Files that don't match any group pattern are collected in the "Rest" group.

**Group Configuration**

```ts
{
  groups: [
    {
      title: 'Features Only',
      includeInputs: '**/feature-*.ts',
    },
  ];
}
```

**File Matching:**

```txt
stats.json
└── outputs
    └── dist/app.js 300kB
        ├── 🎯 src/feature-1.ts      // matches group
        ├── 🎯 src/feature-2.ts      // matches group
        ├── ❓ src/index.ts          // unmatched -> Rest
        └── ❓ src/utils/format.ts   // unmatched -> Rest
```

**Table Result:**

| Group         | Modules | Size   |
| ------------- | ------- | ------ |
| Features Only | 2       | 175 kB |
| Rest          | -       | 275 kB |

#### Rest Group - Bundler Overhead

When using `onlyMatching` mode, bundler overhead becomes part of the Rest group.

**Group Configuration**

```ts
{
  mode: 'onlyMatching',
  groups: [
    {
      title: 'Source Files',
      includeInputs: '**/src/**'
    }
  ]
}
```

**File Analysis:**

```txt
dist/app.js total: 300kB
├── src files: 250kB         // matches group
└── bundler overhead: 50kB   // becomes Rest
```

**Table Result:**

| Group        | Modules | Size   |
| ------------ | ------- | ------ |
| Source Files | 4       | 250 kB |
| Rest         | -       | 50 kB  |

---

#### Pruning - Max Children

Limit the number of groups displayed in the table.

**Group Configuration**

```ts
{
  groups: [
    { title: 'Features', includeInputs: '**/feature-*.ts' },
    { title: 'Utils', includeInputs: '**/utils/**' },
    { title: 'Components', includeInputs: '**/components/**' },
    { title: 'Services', includeInputs: '**/services/**' },
    { title: 'Helpers', includeInputs: '**/helpers/**' }
  ],
  pruning: {
    enabled: true,
    maxChildren: 3
  }
}
```

**Table Result:**

| Group      | Modules | Size   |
| ---------- | ------- | ------ |
| Features   | 2       | 175 kB |
| Components | 5       | 125 kB |
| Services   | 3       | 100 kB |
| Rest       | -       | 200 kB |

_Utils and Helpers groups were moved to Rest due to maxChildren limit_

#### Pruning - Min Size

Filter out groups smaller than the specified threshold.

**Group Configuration**

```ts
{
  groups: [
    { title: 'Large Feature', includeInputs: '**/large-feature.ts' },    // 100kB
    { title: 'Medium Feature', includeInputs: '**/medium-feature.ts' },  // 50kB
    { title: 'Small Feature', includeInputs: '**/small-feature.ts' },    // 10kB
    { title: 'Tiny Feature', includeInputs: '**/tiny-feature.ts' }       // 2kB
  ],
  pruning: {
    enabled: true,
    minSize: 25000  // 25kB threshold
  }
}
```

**Table Result:**

| Group          | Modules | Size   |
| -------------- | ------- | ------ |
| Large Feature  | 1       | 100 kB |
| Medium Feature | 1       | 50 kB  |
| Rest           | -       | 262 kB |

_Small and Tiny features were moved to Rest due to minSize threshold_

---
